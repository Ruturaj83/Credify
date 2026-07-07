#pragma once
#include <string>
#include <vector>
#include "../models/StatementCycle.h"
#include "../models/CardProfile.h"
#include "../storage/SQLiteStorage.h"

namespace ccims {

class StatementEngine {
public:
    StatementEngine(SQLiteStorage* storage) : storage_(storage) {}

    void processTimeTick(int64_t current_time_epoch, const std::vector<CardProfile>& active_cards);
    void checkAndResetCycles(int64_t current_time_epoch, const CardProfile& card);

private:
    SQLiteStorage* storage_;
};

}
