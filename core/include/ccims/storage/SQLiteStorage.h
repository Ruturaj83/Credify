#pragma once
#include <string>
#include <vector>
#include "../models/Transaction.h"
#include "../models/StatementCycle.h"

struct sqlite3;

namespace ccims {

class SQLiteStorage {
public:
    SQLiteStorage(const std::string& db_path);
    ~SQLiteStorage();

    bool initSchema();

    // Transactions
    bool saveTransaction(const TransactionRecord& record);
    std::vector<TransactionRecord> getTransactions();

    // Statement Cycles
    bool saveStatementCycle(const StatementCycle& cycle);
    std::vector<StatementCycle> getStatementCycles(const std::string& card_id);

    // Caps Tracking
    bool updateCapAccumulated(const std::string& cap_id, double amount);
    double getCapAccumulated(const std::string& cap_id);

private:
    sqlite3* db;
};

}
