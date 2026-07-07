#pragma once
#include <vector>
#include <string>
#include <unordered_map>
#include "../models/Transaction.h"
#include "../storage/SQLiteStorage.h"

namespace ccims {

struct AnalyticsReport {
    double total_spend = 0;
    double total_rewards = 0;
    std::unordered_map<std::string, double> spend_by_card;
    std::unordered_map<std::string, double> spend_by_category;
    std::string most_used_card;
};

class AnalyticsEngine {
public:
    AnalyticsEngine(SQLiteStorage* storage) : storage_(storage) {}

    AnalyticsReport generateReport(int64_t start_time, int64_t end_time);

private:
    SQLiteStorage* storage_;
};

}
