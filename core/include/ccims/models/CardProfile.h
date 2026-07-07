#pragma once
#include <string>
#include <vector>
#include <unordered_map>
#include "Rule.h"

namespace ccims {

// Card definition in the global catalogue (shared, immutable)
struct CardCatalogueEntry {
    std::string id;
    std::string name;
    std::string issuer;
    std::string network;
    std::string card_type;
    
    double annual_fee = 0;
    double joining_fee = 0;
    
    std::vector<RewardRule> reward_rules;
    std::vector<LoungePolicy> lounge_policies;
    std::unordered_map<std::string, Cap> caps;
    
    int64_t effective_from = 0;
    int version = 1;
};

// A user's personal card instance, linking to a catalogue entry
struct UserCard {
    std::string id;
    std::string user_id;
    std::string catalogue_id;
    
    int statement_day = 1;
    int grace_period_days = 20;
    int64_t opened_date = 0;
    
    bool is_active = true;
    
    CardCatalogueEntry catalogue_info;
};

// CardProfile is the unified view used by all engines.
// It flattens UserCard + CardCatalogueEntry so engines can directly
// access reward_rules, caps, lounge_policies alongside user-specific
// fields like is_active and statement_day.
struct CardProfile {
    // Identity
    std::string id;          // UserCard.id (unique per user-card)
    std::string user_id;
    std::string catalogue_id;
    std::string name;
    std::string issuer;
    std::string network;
    std::string card_type;

    // User-specific instance fields
    int statement_day = 1;
    int grace_period_days = 20;
    int64_t opened_date = 0;
    bool is_active = true;

    // Catalogue-inherited reward configuration
    double annual_fee = 0;
    double joining_fee = 0;
    std::vector<RewardRule> reward_rules;
    std::vector<LoungePolicy> lounge_policies;
    std::unordered_map<std::string, Cap> caps;
    int version = 1;

    // Construct a CardProfile from a UserCard (flattens catalogue_info)
    static CardProfile fromUserCard(const UserCard& uc) {
        CardProfile cp;
        cp.id = uc.id;
        cp.user_id = uc.user_id;
        cp.catalogue_id = uc.catalogue_id;
        cp.statement_day = uc.statement_day;
        cp.grace_period_days = uc.grace_period_days;
        cp.opened_date = uc.opened_date;
        cp.is_active = uc.is_active;

        const auto& cat = uc.catalogue_info;
        cp.name = cat.name;
        cp.issuer = cat.issuer;
        cp.network = cat.network;
        cp.card_type = cat.card_type;
        cp.annual_fee = cat.annual_fee;
        cp.joining_fee = cat.joining_fee;
        cp.reward_rules = cat.reward_rules;
        cp.lounge_policies = cat.lounge_policies;
        cp.caps = cat.caps;
        cp.version = cat.version;

        return cp;
    }
};

}
