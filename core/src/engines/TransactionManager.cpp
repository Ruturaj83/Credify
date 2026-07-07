#include "ccims/engines/TransactionManager.h"
#include <iostream>

namespace ccims {

TransactionRecord TransactionManager::processNewTransaction(const Transaction& tx, const std::vector<CardProfile>& active_cards, const std::string& actual_card_id) {
    RecommendationResult rec = reward_engine_->recommendBestCard(tx, active_cards);
    
    TransactionRecord record;
    record.id = tx.id;
    record.timestamp = tx.timestamp;
    record.merchant = tx.merchant;
    record.amount = tx.amount;
    record.currency = tx.currency;
    record.category = tx.category;
    record.mcc = tx.mcc;
    record.is_recurring = tx.is_recurring;
    
    record.recommended_card = rec.card_id;
    record.actual_card = actual_card_id.empty() ? rec.card_id : actual_card_id;
    record.is_manual_correction = false;
    
    record.reward_earned = 0;
    for (const auto& card : active_cards) {
        if (card.id == record.actual_card) {
            RecommendationResult single_rec = reward_engine_->recommendBestCard(tx, {card});
            record.reward_earned = single_rec.expected_reward;
            break;
        }
    }
    
    if (storage_) {
        storage_->saveTransaction(record);
    }
    return record;
}

bool TransactionManager::correctTransaction(const std::string& transaction_id, const std::string& new_actual_card_id, const std::vector<CardProfile>& all_cards) {
    // Placeholder
    return true; 
}

}
