#pragma once
#include <string>
#include <vector>
#include "../models/CardProfile.h"

namespace ccims {

class JsonConfigLoader {
public:
    static std::vector<CardProfile> loadCards(const std::string& filepath);
};

}
