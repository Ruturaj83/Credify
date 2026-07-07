#include "ccims/engines/LoungeEngine.h"

namespace ccims {

LoungeEligibility LoungeEngine::checkEligibility(const std::string& card_id, const CardProfile& card, int64_t current_time) {
    LoungeEligibility result{false, 0, "No lounge policy found"};
    
    if (card.lounge_policies.empty()) {
        return result;
    }
    
    const auto& policy = card.lounge_policies.front();
    
    if (policy.total_visits_per_year > 0) {
        result.is_eligible = true;
        result.remaining_visits = policy.total_visits_per_year; 
        result.reason = "Eligible. Visits remaining: " + std::to_string(result.remaining_visits);
    } else {
        result.is_eligible = false;
        result.reason = "No visits allowed.";
    }
    
    return result;
}

bool LoungeEngine::recordVisit(const std::string& card_id, const CardProfile& card, int64_t current_time) {
    return true;
}

}
