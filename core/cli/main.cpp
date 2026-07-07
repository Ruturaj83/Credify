#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <iomanip>
#include "ccims/models/CardProfile.h"
#include "ccims/models/Transaction.h"
#include "ccims/storage/JsonConfigLoader.h"
#include "ccims/storage/SQLiteStorage.h"
#include "ccims/engines/RewardEngine.h"
#include "ccims/engines/TransactionManager.h"
#include "ccims/engines/StatementEngine.h"
#include "ccims/engines/LoungeEngine.h"
#include "ccims/engines/AnalyticsEngine.h"

using namespace ccims;

int main() {
    std::cout << "Starting Credit Card Intelligence and Management System (CCIMS)...\n";
    
    auto cards = JsonConfigLoader::loadCards("../data/cards.json");
    std::cout << "Loaded " << cards.size() << " cards from configuration.\n";
    
    SQLiteStorage storage("../data/ccims.db");
    
    RewardEngine reward_engine(&storage);
    TransactionManager tx_manager(&storage, &reward_engine);
    StatementEngine stmt_engine(&storage);
    LoungeEngine lounge_engine(&storage);
    AnalyticsEngine analytics_engine(&storage);
    
    while (true) {
        std::cout << "\n===============================\n";
        std::cout << "           CCIMS CLI           \n";
        std::cout << "===============================\n";
        std::cout << "1. Add a transaction\n";
        std::cout << "2. View transaction history\n";
        std::cout << "3. View analytics\n";
        std::cout << "4. Check lounge eligibility\n";
        std::cout << "5. Process statement cycle tick\n";
        std::cout << "6. Exit\n";
        std::cout << "Choice: ";
        
        int choice;
        if (!(std::cin >> choice)) break;
        
        if (choice == 1) {
            Transaction tx;
            tx.id = "tx_" + std::to_string(std::chrono::system_clock::now().time_since_epoch().count());
            tx.timestamp = std::chrono::system_clock::now().time_since_epoch().count();
            
            std::cout << "Merchant: ";
            std::cin >> tx.merchant;
            std::cout << "Amount: ";
            std::cin >> tx.amount;
            std::cout << "Category: ";
            std::cin >> tx.category;
            
            auto rec = reward_engine.recommendBestCard(tx, cards);
            std::cout << "\n--- Recommendation ---\n";
            std::cout << "Best Card: " << rec.card_id << "\n";
            std::cout << "Expected Reward: " << rec.expected_reward << "\n";
            std::cout << "Rule Applied: " << rec.rule_applied << "\n";
            
            std::cout << "\nEnter actual card used (or leave blank to use recommended): ";
            std::string actual_card;
            std::cin.ignore();
            std::getline(std::cin, actual_card);
            
            auto record = tx_manager.processNewTransaction(tx, cards, actual_card);
            std::cout << "Transaction saved! Reward earned: " << record.reward_earned << "\n";
            
        } else if (choice == 2) {
            auto history = storage.getTransactions();
            std::cout << "\n--- History ---\n";
            for (const auto& r : history) {
                std::cout << "[" << r.id << "] " << r.merchant << " | " << r.amount 
                          << " | Card: " << r.actual_card << " | Reward: " << r.reward_earned << "\n";
            }
        } else if (choice == 3) {
            auto report = analytics_engine.generateReport(0, INT64_MAX);
            std::cout << "\n--- Analytics ---\n";
            std::cout << "Total Spend: " << report.total_spend << "\n";
            std::cout << "Total Rewards: " << report.total_rewards << "\n";
            std::cout << "Most Used Card: " << report.most_used_card << "\n";
            for (const auto& [card, spend] : report.spend_by_card) {
                std::cout << "  - " << card << ": " << spend << "\n";
            }
        } else if (choice == 4) {
            std::cout << "Enter card ID: ";
            std::string card_id;
            std::cin >> card_id;
            
            CardProfile cp;
            for (const auto& c : cards) {
                if (c.id == card_id) cp = c;
            }
            
            auto elig = lounge_engine.checkEligibility(card_id, cp, 0);
            std::cout << "\n--- Lounge Eligibility ---\n";
            std::cout << "Eligible: " << (elig.is_eligible ? "Yes" : "No") << "\n";
            std::cout << "Reason: " << elig.reason << "\n";
        } else if (choice == 5) {
            stmt_engine.processTimeTick(std::chrono::system_clock::now().time_since_epoch().count(), cards);
            std::cout << "Statement cycles processed.\n";
        } else if (choice == 6) {
            break;
        }
    }
    
    return 0;
}
