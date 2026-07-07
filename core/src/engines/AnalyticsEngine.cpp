#include "ccims/engines/AnalyticsEngine.h"

namespace ccims {

AnalyticsReport AnalyticsEngine::generateReport(int64_t start_time, int64_t end_time) {
    AnalyticsReport report;
    
    if (!storage_) return report;

    auto txs = storage_->getTransactions();
    
    std::string top_card = "";
    int max_tx = 0;
    std::unordered_map<std::string, int> tx_counts;
    
    for (const auto& tx : txs) {
        if (tx.timestamp >= start_time && tx.timestamp <= end_time) {
            report.total_spend += tx.amount;
            report.total_rewards += tx.reward_earned;
            
            report.spend_by_card[tx.actual_card] += tx.amount;
            report.spend_by_category[tx.category] += tx.amount;
            
            tx_counts[tx.actual_card]++;
            if (tx_counts[tx.actual_card] > max_tx) {
                max_tx = tx_counts[tx.actual_card];
                top_card = tx.actual_card;
            }
        }
    }
    
    report.most_used_card = top_card;
    return report;
}

}
