#pragma once
#include <vector>
#include <string>
#include "../models/Transaction.h"
#include "../models/CardProfile.h"
#include "RewardEngine.h"
#include "../storage/SQLiteStorage.h"

namespace ccims {

class TransactionManager {
public:
    TransactionManager(SQLiteStorage* storage, RewardEngine* reward_engine)
        : storage_(storage), reward_engine_(reward_engine) {}

    TransactionRecord processNewTransaction(const Transaction& tx, const std::vector<CardProfile>& active_cards, const std::string& actual_card_id = "");
    
    bool correctTransaction(const std::string& transaction_id, const std::string& new_actual_card_id, const std::vector<CardProfile>& all_cards);

private:
    SQLiteStorage* storage_;
    RewardEngine* reward_engine_;
};

}
