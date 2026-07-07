#pragma once
#include <string>
#include <cstdint>

namespace ccims {

struct Transaction {
    std::string id;
    std::string user_id;
    int64_t timestamp;
    std::string merchant;
    double amount;
    std::string currency;
    std::string category;
    std::string mcc;
    bool is_recurring = false;
};

struct TransactionRecord : public Transaction {
    std::string recommended_card;
    std::string actual_card;
    double reward_earned;
    bool is_manual_correction = false;
};

}
