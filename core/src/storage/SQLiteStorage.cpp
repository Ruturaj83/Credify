#include "ccims/storage/SQLiteStorage.h"
#include "sqlite3.h"
#include <iostream>

namespace ccims {

SQLiteStorage::SQLiteStorage(const std::string& db_path) {
    if (sqlite3_open(db_path.c_str(), &db) != SQLITE_OK) {
        std::cerr << "Cannot open database: " << sqlite3_errmsg(db) << std::endl;
    } else {
        initSchema();
    }
}

SQLiteStorage::~SQLiteStorage() {
    if (db) {
        sqlite3_close(db);
    }
}

bool SQLiteStorage::initSchema() {
    const char* sql = R"(
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            timestamp INTEGER,
            merchant TEXT,
            amount REAL,
            category TEXT,
            actual_card TEXT,
            reward_earned REAL
        );

        CREATE TABLE IF NOT EXISTS statement_cycles (
            id TEXT PRIMARY KEY,
            card_id TEXT,
            start_date INTEGER,
            end_date INTEGER,
            opening_balance REAL,
            closing_balance REAL,
            minimum_due REAL,
            is_paid INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS cap_tracking (
            cap_id TEXT PRIMARY KEY,
            accumulated REAL DEFAULT 0,
            period_start INTEGER,
            period_end INTEGER
        );
    )";
    char* err_msg = 0;
    if (sqlite3_exec(db, sql, 0, 0, &err_msg) != SQLITE_OK) {
        std::cerr << "SQL error: " << err_msg << std::endl;
        sqlite3_free(err_msg);
        return false;
    }
    return true;
}

// Fixed: Use prepared statements to prevent SQL injection
bool SQLiteStorage::saveTransaction(const TransactionRecord& record) {
    const char* sql = "INSERT INTO transactions (id, timestamp, merchant, amount, category, actual_card, reward_earned) VALUES (?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }

    sqlite3_bind_text(stmt, 1, record.id.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 2, record.timestamp);
    sqlite3_bind_text(stmt, 3, record.merchant.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 4, record.amount);
    sqlite3_bind_text(stmt, 5, record.category.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 6, record.actual_card.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 7, record.reward_earned);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        std::cerr << "Failed to save transaction: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }
    return true;
}

std::vector<TransactionRecord> SQLiteStorage::getTransactions() {
    std::vector<TransactionRecord> records;
    const char* sql = "SELECT id, timestamp, merchant, amount, category, actual_card, reward_earned FROM transactions;";
    sqlite3_stmt* stmt;
    
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            TransactionRecord rec;
            const unsigned char* id_text = sqlite3_column_text(stmt, 0);
            if (id_text) rec.id = reinterpret_cast<const char*>(id_text);
            
            rec.timestamp = sqlite3_column_int64(stmt, 1);
            
            const unsigned char* m_text = sqlite3_column_text(stmt, 2);
            if (m_text) rec.merchant = reinterpret_cast<const char*>(m_text);
            
            rec.amount = sqlite3_column_double(stmt, 3);
            
            const unsigned char* c_text = sqlite3_column_text(stmt, 4);
            if (c_text) rec.category = reinterpret_cast<const char*>(c_text);
            
            const unsigned char* a_text = sqlite3_column_text(stmt, 5);
            if (a_text) rec.actual_card = reinterpret_cast<const char*>(a_text);
            
            rec.reward_earned = sqlite3_column_double(stmt, 6);
            records.push_back(rec);
        }
        sqlite3_finalize(stmt);
    }
    return records;
}

// Implemented: Statement cycle persistence
bool SQLiteStorage::saveStatementCycle(const StatementCycle& cycle) {
    const char* sql = "INSERT OR REPLACE INTO statement_cycles (id, card_id, start_date, end_date, opening_balance, closing_balance, minimum_due, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) {
        std::cerr << "Failed to prepare statement: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }

    sqlite3_bind_text(stmt, 1, cycle.id.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, cycle.card_id.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int64(stmt, 3, cycle.start_date);
    sqlite3_bind_int64(stmt, 4, cycle.end_date);
    sqlite3_bind_double(stmt, 5, cycle.opening_balance);
    sqlite3_bind_double(stmt, 6, cycle.closing_balance);
    sqlite3_bind_double(stmt, 7, cycle.minimum_due);
    sqlite3_bind_int(stmt, 8, cycle.is_paid ? 1 : 0);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return rc == SQLITE_DONE;
}

std::vector<StatementCycle> SQLiteStorage::getStatementCycles(const std::string& card_id) {
    std::vector<StatementCycle> cycles;
    const char* sql = "SELECT id, card_id, start_date, end_date, opening_balance, closing_balance, minimum_due, is_paid FROM statement_cycles WHERE card_id = ? ORDER BY start_date DESC;";
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, card_id.c_str(), -1, SQLITE_TRANSIENT);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            StatementCycle cycle;
            const unsigned char* id_text = sqlite3_column_text(stmt, 0);
            if (id_text) cycle.id = reinterpret_cast<const char*>(id_text);

            const unsigned char* cid_text = sqlite3_column_text(stmt, 1);
            if (cid_text) cycle.card_id = reinterpret_cast<const char*>(cid_text);

            cycle.start_date = sqlite3_column_int64(stmt, 2);
            cycle.end_date = sqlite3_column_int64(stmt, 3);
            cycle.opening_balance = sqlite3_column_double(stmt, 4);
            cycle.closing_balance = sqlite3_column_double(stmt, 5);
            cycle.minimum_due = sqlite3_column_double(stmt, 6);
            cycle.is_paid = sqlite3_column_int(stmt, 7) != 0;

            cycles.push_back(cycle);
        }
        sqlite3_finalize(stmt);
    }
    return cycles;
}

// Implemented: Cap accumulation tracking
bool SQLiteStorage::updateCapAccumulated(const std::string& cap_id, double amount) {
    const char* sql = "INSERT INTO cap_tracking (cap_id, accumulated) VALUES (?, ?) ON CONFLICT(cap_id) DO UPDATE SET accumulated = accumulated + ?;";
    sqlite3_stmt* stmt;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) {
        std::cerr << "Failed to prepare cap update: " << sqlite3_errmsg(db) << std::endl;
        return false;
    }

    sqlite3_bind_text(stmt, 1, cap_id.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 2, amount);
    sqlite3_bind_double(stmt, 3, amount);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return rc == SQLITE_DONE;
}

double SQLiteStorage::getCapAccumulated(const std::string& cap_id) {
    const char* sql = "SELECT accumulated FROM cap_tracking WHERE cap_id = ?;";
    sqlite3_stmt* stmt;
    double accumulated = 0.0;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, cap_id.c_str(), -1, SQLITE_TRANSIENT);
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            accumulated = sqlite3_column_double(stmt, 0);
        }
        sqlite3_finalize(stmt);
    }
    return accumulated;
}

}
