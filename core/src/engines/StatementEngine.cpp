#include "ccims/engines/StatementEngine.h"

namespace ccims {

void StatementEngine::processTimeTick(int64_t current_time_epoch, const std::vector<CardProfile>& active_cards) {
    for (const auto& card : active_cards) {
        if (!card.is_active) continue;
        checkAndResetCycles(current_time_epoch, card);
    }
}

void StatementEngine::checkAndResetCycles(int64_t current_time_epoch, const CardProfile& card) {
    auto cycles = storage_->getStatementCycles(card.id);
    if (cycles.empty()) return;

    StatementCycle latest = cycles.back();
    if (current_time_epoch > latest.end_date) {
        latest.outstanding_amount += latest.cycle_spend;
        latest.cycle_spend = 0;
        storage_->saveStatementCycle(latest);

        StatementCycle next_cycle;
        next_cycle.id = latest.id + "_next"; 
        next_cycle.card_id = card.id;
        next_cycle.start_date = latest.end_date + 1;
        next_cycle.end_date = latest.end_date + (30LL * 24 * 3600); 
        next_cycle.due_date = next_cycle.end_date + (card.grace_period_days * 24LL * 3600);
        
        storage_->saveStatementCycle(next_cycle);
    }
}

}
