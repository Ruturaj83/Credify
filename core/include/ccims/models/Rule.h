#pragma once
#include <string>
#include <vector>
#include <cstdint>

namespace ccims {

enum class RewardType {
    CASHBACK,
    POINTS,
    MILES
};

struct Cap {
    std::string id;
    std::string period; // "MONTHLY", "QUARTERLY", "YEARLY", "BILLING_CYCLE"
    double max_reward;
    double current_accumulated = 0;
};

struct RewardRule {
    std::string rule_id;
    std::vector<std::string> categories;
    std::vector<std::string> mccs;
    std::vector<std::string> merchants;
    
    RewardType type = RewardType::CASHBACK;
    double rate = 0; // percentage or points per currency unit
    double point_value = 1.0; // if points/miles, value per point in local currency
    
    int64_t effective_from = 0;
    int64_t effective_to = INT64_MAX;

    std::string cap_id; // references a Cap
};

struct LoungePolicy {
    std::string network; // "VISA", "MASTERCARD", "PRIORITY_PASS"
    int total_visits_per_year = 0;
    int visits_per_quarter = 0;
    double minimum_spend_threshold = 0;
    std::string spend_period; // "PREVIOUS_QUARTER", "PREVIOUS_MONTH", "PREVIOUS_YEAR"
};

}
