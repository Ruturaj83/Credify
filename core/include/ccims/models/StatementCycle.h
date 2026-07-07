#pragma once
#include <string>
#include <cstdint>

namespace ccims {

struct StatementCycle {
    std::string id;
    std::string card_id;
    int64_t start_date;
    int64_t end_date;
    int64_t due_date;
    
    double cycle_spend = 0;
    double rewards_earned = 0;
    double outstanding_amount = 0;
    
    bool is_paid = false;
};

}
