#include "ccims/engines/RewardEngine.h"
#include <algorithm>

namespace ccims {

const RewardRule* RewardEngine::findBestRule(const Transaction& tx, const CardProfile& card) {
    const RewardRule* best_rule = nullptr;
    double max_rate = -1.0;

    for (const auto& rule : card.reward_rules) {
        if (tx.timestamp >= rule.effective_from && tx.timestamp <= rule.effective_to) {
            bool matches = false;
            
            // Check merchant
            for (const auto& m : rule.merchants) {
                if (m == tx.merchant) matches = true;
            }
            // Check category
            for (const auto& c : rule.categories) {
                if (c == tx.category || c == "ALL") matches = true;
            }
            // Check mcc
            for (const auto& m : rule.mccs) {
                if (m == tx.mcc) matches = true;
            }
            
            if (matches && rule.rate > max_rate) {
                max_rate = rule.rate;
                best_rule = &rule;
            }
        }
    }
    return best_rule;
}

double RewardEngine::calculateFinalReward(const Transaction& tx, const CardProfile& card, const RewardRule& applied_rule) {
    double raw_reward = tx.amount * (applied_rule.rate / 100.0) * applied_rule.point_value;
    
    if (!applied_rule.cap_id.empty() && storage_ != nullptr) {
        double current_accum = storage_->getCapAccumulated(applied_rule.cap_id);
        auto it = card.caps.find(applied_rule.cap_id);
        if (it != card.caps.end()) {
            double remaining_cap = it->second.max_reward - current_accum;
            if (remaining_cap < 0) remaining_cap = 0;
            if (raw_reward > remaining_cap) {
                raw_reward = remaining_cap;
            }
        }
    }
    
    return raw_reward;
}

RecommendationResult RewardEngine::recommendBestCard(const Transaction& tx, const std::vector<CardProfile>& active_cards) {
    RecommendationResult best_rec{"", -1.0, ""};
    
    for (const auto& card : active_cards) {
        if (!card.is_active) continue;
        
        const RewardRule* best_rule = findBestRule(tx, card);
        if (best_rule) {
            double final_reward = calculateFinalReward(tx, card, *best_rule);
            if (final_reward > best_rec.expected_reward) {
                best_rec.expected_reward = final_reward;
                best_rec.card_id = card.id;
                best_rec.rule_applied = best_rule->rule_id;
            }
        }
    }
    
    return best_rec;
}

}
