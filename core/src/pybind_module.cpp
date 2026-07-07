#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "ccims/engines/RewardEngine.h"
#include "ccims/engines/TransactionManager.h"
#include "ccims/engines/AnalyticsEngine.h"
#include "ccims/storage/SQLiteStorage.h"

namespace py = pybind11;
using namespace ccims;

class CCIMSEngineFacade {
public:
    CCIMSEngineFacade(const std::string& db_path) 
        : storage_(db_path), reward_(&storage_), tx_manager_(&storage_, &reward_), analytics_(&storage_) {}

    py::dict getAnalytics(const std::string& user_id) {
        auto report = analytics_.generateReport(0, INT64_MAX); // In a real system, scope by user_id
        py::dict result;
        result["total_spend"] = report.total_spend;
        result["total_rewards"] = report.total_rewards;
        result["most_used_card"] = report.most_used_card;
        py::dict spend_by_card;
        for(auto const& [key, val] : report.spend_by_card) {
            spend_by_card[key] = val;
        }
        result["spend_by_card"] = spend_by_card;
        return result;
    }

private:
    SQLiteStorage storage_;
    RewardEngine reward_;
    TransactionManager tx_manager_;
    AnalyticsEngine analytics_;
};

PYBIND11_MODULE(ccims_core, m) {
    py::class_<CCIMSEngineFacade>(m, "CCIMSEngine")
        .def(py::init<const std::string &>())
        .def("get_analytics", &CCIMSEngineFacade::getAnalytics);
}
