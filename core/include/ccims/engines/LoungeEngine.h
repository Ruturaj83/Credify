#pragma once
#include <string>
#include "../models/CardProfile.h"
#include "../storage/SQLiteStorage.h"

namespace ccims {

struct LoungeEligibility {
    bool is_eligible;
    int remaining_visits;
    std::string reason;
};

class LoungeEngine {
public:
    LoungeEngine(SQLiteStorage* storage) : storage_(storage) {}

    LoungeEligibility checkEligibility(const std::string& card_id, const CardProfile& card, int64_t current_time);
    bool recordVisit(const std::string& card_id, const CardProfile& card, int64_t current_time);

private:
    SQLiteStorage* storage_;
};

}
