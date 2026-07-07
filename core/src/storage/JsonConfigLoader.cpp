#include "ccims/storage/JsonConfigLoader.h"
#include <fstream>
#include <iostream>
#include "json.hpp"

using json = nlohmann::json;

namespace ccims {

std::vector<CardProfile> JsonConfigLoader::loadCards(const std::string& filepath) {
    std::vector<CardProfile> profiles;
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "Failed to open config file: " << filepath << std::endl;
        return profiles;
    }

    try {
        json j;
        file >> j;
        
        for (const auto& item : j["cards"]) {
            CardProfile card;
            card.id = item.value("id", "");
            card.name = item.value("name", "");
            card.issuer = item.value("issuer", "");
            card.network = item.value("network", "");
            card.annual_fee = item.value("annual_fee", 0.0);
            
            if (item.contains("reward_rules")) {
                for (const auto& r : item["reward_rules"]) {
                    RewardRule rule;
                    rule.rule_id = r.value("rule_id", "");
                    if (r.contains("categories")) {
                        for (const auto& c : r["categories"]) rule.categories.push_back(c.get<std::string>());
                    }
                    rule.rate = r.value("rate", 0.0);
                    card.reward_rules.push_back(rule);
                }
            }
            
            profiles.push_back(card);
        }
    } catch (const std::exception& e) {
        std::cerr << "Error parsing JSON: " << e.what() << std::endl;
    }

    return profiles;
}

}
