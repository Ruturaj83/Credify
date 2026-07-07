#pragma once
#include <vector>
#include "../models/CardProfile.h"
#include "../models/Transaction.h"
#include "../storage/SQLiteStorage.h"

namespace ccims {

struct RecommendationResult {
    std::string card_id;
    double expected_reward;
    std::string rule_applied;
};

class RewardEngine {
public:
    RewardEngine(SQLiteStorage* storage) : storage_(storage) {}

    RecommendationResult recommendBestCard(const Transaction& tx, const std::vector<CardProfile>& active_cards);
    
    double calculateFinalReward(const Transaction& tx, const CardProfile& card, const RewardRule& applied_rule);

private:
    SQLiteStorage* storage_;

    const RewardRule* findBestRule(const Transaction& tx, const CardProfile& card);
};

}
