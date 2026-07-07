import sqlite3
import uuid
import json
import time
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "..", "data", "ccims.db")

def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

# ─── SCHEMA ─────────────────────────────────────────────────────────
def init_db():
    with get_conn() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS Users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            created_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS CardCatalogue (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            issuer TEXT NOT NULL,
            network TEXT,
            card_type TEXT,
            annual_fee REAL DEFAULT 0,
            joining_fee REAL DEFAULT 0,
            fee_waiver_condition TEXT,
            reward_type TEXT DEFAULT 'POINTS',
            base_reward_rate REAL DEFAULT 1.0,
            reward_rules_json TEXT DEFAULT '[]',
            lounge_access_domestic INTEGER DEFAULT 0,
            lounge_access_international INTEGER DEFAULT 0,
            welcome_bonus TEXT,
            milestone_rewards TEXT,
            forex_markup REAL DEFAULT 0,
            fuel_surcharge_waiver TEXT,
            card_color_from TEXT DEFAULT 'from-blue-800',
            card_color_to TEXT DEFAULT 'to-blue-900',
            benefits_json TEXT DEFAULT '[]',
            eligibility_hint TEXT,
            notes TEXT
        );
        CREATE TABLE IF NOT EXISTS UserCards (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES Users(id),
            catalogue_id TEXT NOT NULL REFERENCES CardCatalogue(id),
            card_nickname TEXT,
            last_four_digits TEXT DEFAULT '0000',
            credit_limit REAL DEFAULT 500000,
            outstanding_amount REAL DEFAULT 0,
            statement_day INTEGER DEFAULT 1,
            due_day INTEGER DEFAULT 20,
            opened_date INTEGER,
            is_active INTEGER DEFAULT 1,
            lounge_visits_used INTEGER DEFAULT 0,
            current_cycle_spend REAL DEFAULT 0,
            total_rewards_earned REAL DEFAULT 0,
            UNIQUE(user_id, catalogue_id)
        );
        CREATE TABLE IF NOT EXISTS Transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES Users(id),
            user_card_id TEXT NOT NULL REFERENCES UserCards(id),
            merchant TEXT NOT NULL,
            category TEXT DEFAULT 'Other',
            amount REAL NOT NULL,
            reward_earned REAL DEFAULT 0,
            reward_rate_applied REAL DEFAULT 0,
            tx_date INTEGER,
            notes TEXT,
            is_corrected INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS Alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES Users(id),
            alert_type TEXT,
            title TEXT,
            message TEXT,
            severity TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            created_at INTEGER,
            related_card_id TEXT
        );
        """)
        # Seed catalogue
        cur = conn.execute("SELECT count(*) FROM CardCatalogue")
        if cur.fetchone()[0] == 0:
            _seed_catalogue(conn)

def _seed_catalogue(conn):
    cards = [
      ("cat_01","HDFC Regalia","HDFC Bank","VISA","Premium",2500,0,"Waived on 3L annual spend","POINTS",1.0,
       json.dumps([{"category":"Travel","rate":4.0,"cap_monthly":5000},{"category":"Dining","rate":4.0,"cap_monthly":5000},{"category":"Grocery","rate":2.0,"cap_monthly":3000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       6,0,"2500 reward points on first spend","5000 pts on 5L annual spend",3.5,"1% waiver up to 250/mo",
       "from-indigo-700","to-indigo-950",
       json.dumps(["4x on Travel & Dining","2x on Groceries","6 domestic lounge visits","Concierge service","Golf privileges"]),
       "Income 12L+","Flagship travel card"),

      ("cat_02","HDFC Infinia","HDFC Bank","VISA","Super Premium",12500,12500,"Non-waivable","POINTS",3.3,
       json.dumps([{"category":"Travel","rate":5.0,"cap_monthly":None},{"category":"Dining","rate":5.0,"cap_monthly":None},{"category":"ALL","rate":3.3,"cap_monthly":None}]),
       12,6,"12500 reward points","25000 pts on 10L spend",2.0,"1% waiver up to 400/mo",
       "from-gray-800","to-gray-950",
       json.dumps(["5x on Travel & Dining","3.3x on everything","Unlimited domestic lounges","6 intl lounges","Priority Pass","Golf","Concierge"]),
       "Invite only / 30L+ income","Most premium HDFC card"),

      ("cat_03","HDFC Millennia","HDFC Bank","VISA","Lifestyle",1000,1000,"Waived on 1L spend","POINTS",1.0,
       json.dumps([{"category":"Online","rate":5.0,"cap_monthly":2000},{"category":"Dining","rate":2.5,"cap_monthly":2000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"1000 reward points","None",3.5,"None",
       "from-purple-700","to-purple-900",
       json.dumps(["5% on Amazon, Flipkart, SmartBuy","2.5% on dining & online","1% on all other spends","No lounge access"]),
       "Income 4L+","Great for online shoppers"),

      ("cat_04","SBI SimplyCLICK","SBI Card","VISA","Online Shopping",499,499,"Waived on 1L spend","POINTS",1.0,
       json.dumps([{"category":"Online","rate":10.0,"cap_monthly":2500},{"category":"Shopping","rate":5.0,"cap_monthly":2000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       2,0,"500 reward points","2000 pts on 2L annual spend",3.5,"None",
       "from-blue-600","to-blue-800",
       json.dumps(["10x on partner online stores","5x on all online spends","2 domestic lounge visits/yr","E-vouchers as welcome bonus"]),
       "Income 4L+","Best budget online shopping card"),

      ("cat_05","SBI Elite","SBI Card","VISA","Premium",4999,4999,"Waived on 10L spend","POINTS",2.0,
       json.dumps([{"category":"Dining","rate":5.0,"cap_monthly":5000},{"category":"Grocery","rate":5.0,"cap_monthly":5000},{"category":"Shopping","rate":5.0,"cap_monthly":5000},{"category":"ALL","rate":2.0,"cap_monthly":None}]),
       6,0,"5000 reward points","5000 pts on 2L spend",1.99,"1% waiver up to 250/mo",
       "from-slate-700","to-slate-900",
       json.dumps(["5x on Dining, Grocery, Department stores","2x on everything else","6 domestic lounges/yr","Movie ticket BOGO","Low forex markup"]),
       "Income 12L+","All-rounder premium card"),

      ("cat_06","ICICI Amazon Pay","ICICI Bank","VISA","Cashback",0,0,"Lifetime free","CASHBACK",1.0,
       json.dumps([{"category":"Online","rate":5.0,"cap_monthly":None},{"category":"Shopping","rate":3.0,"cap_monthly":None},{"category":"Fuel","rate":2.0,"cap_monthly":500},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"Amazon voucher worth 500","None",3.5,"1% waiver up to 100/mo",
       "from-amber-600","to-amber-800",
       json.dumps(["5% on Amazon (Prime members)","3% on Amazon (non-Prime)","2% on digital payments","1% on all other spends","Lifetime free"]),
       "Income 3L+","Best card for Amazon shoppers"),

      ("cat_07","ICICI Sapphiro","ICICI Bank","VISA","Premium",3500,0,"Waived on 4L spend","POINTS",1.0,
       json.dumps([{"category":"Dining","rate":4.0,"cap_monthly":4000},{"category":"Travel","rate":4.0,"cap_monthly":4000},{"category":"Grocery","rate":2.0,"cap_monthly":3000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       4,2,"2000 reward points","3000 pts on 5L spend",2.0,"1% waiver up to 200/mo",
       "from-cyan-700","to-cyan-900",
       json.dumps(["4x on Dining & Travel","2x on Groceries","4 domestic + 2 intl lounges","Buy 1 Get 1 movies"]),
       "Income 8L+","Balanced premium card"),

      ("cat_08","Amex Platinum Travel","American Express","AMEX","Travel",3500,3500,"Waived on 1.5L spend","POINTS",1.0,
       json.dumps([{"category":"Travel","rate":5.0,"cap_monthly":5000},{"category":"Dining","rate":3.0,"cap_monthly":3000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       4,0,"5000 membership reward points","None",3.5,"None",
       "from-emerald-700","to-emerald-900",
       json.dumps(["5x on travel via Amex portal","3x on dining","4 domestic lounge visits","Travel insurance","Zero lost card liability"]),
       "Income 6L+","Dedicated travel rewards card"),

      ("cat_09","Amex Gold","American Express","AMEX","Lifestyle",1000,0,"Waived on 40K spend","POINTS",1.0,
       json.dumps([{"category":"Online","rate":4.0,"cap_monthly":3000},{"category":"Dining","rate":2.0,"cap_monthly":2000},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"2000 membership reward points","4000 pts on 4L spend",3.5,"None",
       "from-yellow-600","to-yellow-800",
       json.dumps(["4x on Amazon, Flipkart, Uber","2x on dining","Easy fee waiver at 40K","Fraud protection"]),
       "Income 4L+","Good entry-level Amex"),

      ("cat_10","Axis Flipkart","Axis Bank","VISA","Cashback",500,500,"Waived on 2L spend","CASHBACK",1.5,
       json.dumps([{"category":"Online","rate":5.0,"cap_monthly":2500},{"category":"Shopping","rate":4.0,"cap_monthly":2000},{"category":"ALL","rate":1.5,"cap_monthly":None}]),
       0,0,"Flipkart voucher 500","None",3.5,"None",
       "from-blue-500","to-blue-700",
       json.dumps(["5% cashback on Flipkart","4% on preferred partners","1.5% on all other spends","No lounge access"]),
       "Income 3L+","Best for Flipkart shoppers"),

      ("cat_11","Axis Magnus","Axis Bank","VISA","Super Premium",12500,12500,"Non-waivable","POINTS",1.2,
       json.dumps([{"category":"Travel","rate":7.0,"cap_monthly":None},{"category":"Dining","rate":5.0,"cap_monthly":None},{"category":"ALL","rate":1.2,"cap_monthly":None}]),
       8,4,"12500 EDGE reward points","25000 pts on 15L spend",2.0,"Full waiver",
       "from-violet-800","to-violet-950",
       json.dumps(["35 pts/200 on Travel","12 pts/200 on others","8 domestic + 4 intl lounges","Milestone 25K pts at 15L","Meet & greet at airports"]),
       "Income 25L+","Top-tier Axis card"),

      ("cat_12","HDFC Diners Black","HDFC Bank","Diners Club","Super Premium",10000,10000,"Waived on 5L spend","POINTS",2.0,
       json.dumps([{"category":"Online","rate":33.0,"cap_monthly":15000},{"category":"Travel","rate":5.0,"cap_monthly":None},{"category":"Dining","rate":5.0,"cap_monthly":None},{"category":"ALL","rate":2.0,"cap_monthly":None}]),
       99,6,"10000 reward points","10000 pts on 8L spend",2.0,"1% waiver up to 500/mo",
       "from-neutral-800","to-neutral-950",
       json.dumps(["33x on HDFC SmartBuy","5x on Dining & Travel","Unlimited domestic lounges","6 intl lounges","Golf privileges","Concierge"]),
       "Income 15L+","Best points earner via SmartBuy"),

      ("cat_13","Kotak 811","Kotak Mahindra","VISA","Entry Level",0,0,"Lifetime free","CASHBACK",1.0,
       json.dumps([{"category":"Dining","rate":2.0,"cap_monthly":500},{"category":"Online","rate":1.5,"cap_monthly":500},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"None","None",3.5,"None",
       "from-red-600","to-red-800",
       json.dumps(["2% on weekend dining","1.5% on online spends","1% on everything else","Lifetime free","Good starter card"]),
       "Savings account holders","Best beginner card"),

      ("cat_14","RBL ShopRite","RBL Bank","Mastercard","Grocery",500,500,"Waived on 1L spend","POINTS",1.0,
       json.dumps([{"category":"Grocery","rate":5.0,"cap_monthly":2000},{"category":"Online","rate":3.0,"cap_monthly":1500},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"500 reward points","None",3.5,"None",
       "from-green-600","to-green-800",
       json.dumps(["5% on grocery spends","3% on online shopping","1% on all others","No lounge access"]),
       "Income 3L+","Best dedicated grocery card"),

      ("cat_15","IndusInd Legend","IndusInd Bank","VISA","Premium",3000,3000,"Waived on 3L spend","POINTS",1.5,
       json.dumps([{"category":"Dining","rate":4.0,"cap_monthly":3000},{"category":"Grocery","rate":3.0,"cap_monthly":2500},{"category":"Travel","rate":3.0,"cap_monthly":2500},{"category":"ALL","rate":1.5,"cap_monthly":None}]),
       4,0,"Welcome gift 2000 pts","3000 pts on 3L spend",3.5,"1% waiver up to 200/mo",
       "from-orange-700","to-orange-900",
       json.dumps(["4x on Dining","3x on Grocery & Travel","1.5x on others","4 domestic lounges","Golf access"]),
       "Income 8L+","Good all-round premium"),

      ("cat_16","Yes First Exclusive","YES Bank","VISA","Super Premium",10000,10000,"Non-waivable","POINTS",2.0,
       json.dumps([{"category":"Travel","rate":12.0,"cap_monthly":None},{"category":"Dining","rate":6.0,"cap_monthly":None},{"category":"ALL","rate":2.0,"cap_monthly":None}]),
       99,0,"10000 reward points","15000 pts on 10L spend",1.75,"Full waiver",
       "from-teal-700","to-teal-900",
       json.dumps(["12x on Travel","6x on Dining","Unlimited domestic lounges","Golf privileges","Concierge","Low forex at 1.75%"]),
       "Income 20L+","Best travel rewards rate"),

      ("cat_17","AU Zenith","AU Small Finance Bank","VISA","Premium",8000,0,"Waived on 10L spend","POINTS",1.0,
       json.dumps([{"category":"Dining","rate":3.5,"cap_monthly":3000},{"category":"Grocery","rate":2.5,"cap_monthly":2500},{"category":"Travel","rate":2.5,"cap_monthly":2500},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       8,0,"5000 reward points","7500 pts on 7L spend",2.5,"1% waiver up to 300/mo",
       "from-sky-700","to-sky-900",
       json.dumps(["3.5% on Dining","2.5% on Grocery & Travel","8 domestic lounges","Premium concierge","Fuel surcharge waiver"]),
       "Income 12L+","Strong lounge + rewards combo"),

      ("cat_18","IDFC First Select","IDFC First Bank","VISA","Lifestyle",0,0,"Lifetime free","POINTS",1.5,
       json.dumps([{"category":"Online","rate":10.0,"cap_monthly":5000},{"category":"Dining","rate":3.0,"cap_monthly":2000},{"category":"ALL","rate":1.5,"cap_monthly":None}]),
       4,0,"None","None",0.0,"None",
       "from-fuchsia-700","to-fuchsia-900",
       json.dumps(["10x on select brands","3x on dining","1.5x on everything","4 domestic lounges","Zero forex markup","Lifetime free"]),
       "Income 4L+","Best lifetime-free premium card"),

      ("cat_19","OneCard","OneCard (FPL)","Mastercard","Metal",0,0,"Lifetime free","CASHBACK",1.0,
       json.dumps([{"category":"Dining","rate":5.0,"cap_monthly":2500},{"category":"Online","rate":5.0,"cap_monthly":2500},{"category":"ALL","rate":1.0,"cap_monthly":None}]),
       0,0,"None","None",3.5,"None",
       "from-zinc-700","to-zinc-900",
       json.dumps(["5x on top spend categories","Auto-detects best categories","Metal card","App-first experience","Lifetime free"]),
       "Income 3L+","Modern app-first metal card"),

      ("cat_20","Citi Prestige (Legacy)","Citibank","VISA","Ultra Premium",20000,20000,"Non-waivable","POINTS",2.0,
       json.dumps([{"category":"Travel","rate":4.0,"cap_monthly":None},{"category":"Dining","rate":4.0,"cap_monthly":None},{"category":"ALL","rate":2.0,"cap_monthly":None}]),
       99,99,"20000 reward points","15000 pts on 15L spend",0.0,"Full waiver",
       "from-rose-800","to-rose-950",
       json.dumps(["4x on Travel & Dining","2x on everything","Unlimited lounges worldwide","4th night free on hotels","Golf worldwide","Airport transfers","Concierge"]),
       "Invite only / 50L+","Legacy ultra-premium card"),
    ]
    conn.executemany("""
        INSERT INTO CardCatalogue (id,name,issuer,network,card_type,annual_fee,joining_fee,
        fee_waiver_condition,reward_type,base_reward_rate,reward_rules_json,
        lounge_access_domestic,lounge_access_international,welcome_bonus,milestone_rewards,
        forex_markup,fuel_surcharge_waiver,card_color_from,card_color_to,benefits_json,
        eligibility_hint,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    """, cards)

# ─── USER FUNCTIONS ─────────────────────────────────────────────────
def get_user_by_username(username):
    with get_conn() as conn:
        row = conn.execute("SELECT id, username, password_hash, email, created_at FROM Users WHERE username=?", (username,)).fetchone()
        return dict(row) if row else None

def get_user_by_id(user_id):
    with get_conn() as conn:
        row = conn.execute("SELECT id, username, email, created_at FROM Users WHERE id=?", (user_id,)).fetchone()
        return dict(row) if row else None

def create_user(username, password_hash):
    uid = "usr_" + str(uuid.uuid4())
    with get_conn() as conn:
        conn.execute("INSERT INTO Users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
                     (uid, username, password_hash, int(time.time())))
    return uid

def get_user_profile(user_id):
    with get_conn() as conn:
        user = conn.execute("SELECT id, username, email, created_at FROM Users WHERE id=?", (user_id,)).fetchone()
        if not user:
            return None
        card_count = conn.execute("SELECT count(*) FROM UserCards WHERE user_id=? AND is_active=1", (user_id,)).fetchone()[0]
        total_rewards = conn.execute("SELECT COALESCE(SUM(total_rewards_earned),0) FROM UserCards WHERE user_id=?", (user_id,)).fetchone()[0]
        return {**dict(user), "card_count": card_count, "total_rewards": round(total_rewards, 2)}

# ─── CATALOGUE FUNCTIONS ────────────────────────────────────────────
def get_catalogue_cards(search=None, category=None):
    with get_conn() as conn:
        sql = "SELECT * FROM CardCatalogue WHERE 1=1"
        params = []
        if search:
            sql += " AND (name LIKE ? OR issuer LIKE ? OR network LIKE ?)"
            params += [f"%{search}%"] * 3
        if category and category != "All":
            sql += " AND card_type=?"
            params.append(category)
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

def get_catalogue_card_detail(card_id):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM CardCatalogue WHERE id=?", (card_id,)).fetchone()
        return dict(row) if row else None

# ─── USER CARD FUNCTIONS ────────────────────────────────────────────
def get_user_cards(user_id):
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT uc.*, c.name, c.issuer, c.network, c.card_type, c.annual_fee, c.reward_type,
                   c.base_reward_rate, c.card_color_from, c.card_color_to, c.benefits_json,
                   c.lounge_access_domestic, c.lounge_access_international, c.reward_rules_json
            FROM UserCards uc JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE uc.user_id=? AND uc.is_active=1
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]

def get_user_card_detail(user_id, card_id):
    with get_conn() as conn:
        row = conn.execute("""
            SELECT uc.*, c.name, c.issuer, c.network, c.card_type, c.annual_fee, c.joining_fee,
                   c.fee_waiver_condition, c.reward_type, c.base_reward_rate, c.reward_rules_json,
                   c.lounge_access_domestic, c.lounge_access_international, c.welcome_bonus,
                   c.milestone_rewards, c.forex_markup, c.fuel_surcharge_waiver,
                   c.card_color_from, c.card_color_to, c.benefits_json, c.eligibility_hint, c.notes
            FROM UserCards uc JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE uc.id=? AND uc.user_id=?
        """, (card_id, user_id)).fetchone()
        return dict(row) if row else None

def add_user_card(user_id, catalogue_id, last_four="0000", credit_limit=500000, statement_day=1, due_day=20, nickname=None):
    with get_conn() as conn:
        # Validate catalogue_id exists
        cat = conn.execute("SELECT id FROM CardCatalogue WHERE id=?", (catalogue_id,)).fetchone()
        if not cat:
            return None, "Card not found in catalogue"
        # Check duplicate
        dup = conn.execute("SELECT id FROM UserCards WHERE user_id=? AND catalogue_id=? AND is_active=1", (user_id, catalogue_id)).fetchone()
        if dup:
            return None, "Card already in your portfolio"
        uid = "uc_" + str(uuid.uuid4())
        conn.execute("""INSERT INTO UserCards (id, user_id, catalogue_id, card_nickname, last_four_digits,
            credit_limit, statement_day, due_day, opened_date, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (uid, user_id, catalogue_id, nickname, last_four, credit_limit, statement_day, due_day, int(time.time())))
        return uid, None

def remove_user_card(user_id, card_id):
    with get_conn() as conn:
        conn.execute("UPDATE UserCards SET is_active=0 WHERE id=? AND user_id=?", (card_id, user_id))

def update_user_card(user_id, card_id, fields):
    allowed = {"credit_limit", "card_nickname", "statement_day", "due_day"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    if not updates:
        return
    set_clause = ", ".join(f"{k}=?" for k in updates)
    values = list(updates.values()) + [card_id, user_id]
    with get_conn() as conn:
        conn.execute(f"UPDATE UserCards SET {set_clause} WHERE id=? AND user_id=?", values)

# ─── TRANSACTION FUNCTIONS ──────────────────────────────────────────
def create_transaction(user_id, user_card_id, merchant, category, amount, notes=None):
    with get_conn() as conn:
        # Get user card + catalogue info for reward calc
        card = conn.execute("""
            SELECT uc.id, uc.catalogue_id, c.reward_rules_json, c.base_reward_rate
            FROM UserCards uc JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE uc.id=? AND uc.user_id=? AND uc.is_active=1
        """, (user_card_id, user_id)).fetchone()
        if not card:
            return None, "Card not found"
        
        # Calculate reward
        rules = json.loads(card["reward_rules_json"]) if card["reward_rules_json"] else []
        rate = card["base_reward_rate"]
        for rule in rules:
            rule_cat = rule.get("category", "")
            if rule_cat.upper() == category.upper() or rule_cat.upper() in merchant.upper():
                rate = rule.get("rate", rate)
                break
            if rule_cat == "ALL":
                rate = rule.get("rate", rate)
        
        reward = round(amount * rate / 100.0, 2)
        
        # Check cap
        for rule in rules:
            if (rule.get("category", "").upper() == category.upper() or rule.get("category") == "ALL"):
                cap = rule.get("cap_monthly")
                if cap and cap > 0:
                    # Get this month's accumulated rewards for this card in this category
                    month_start = int(time.time()) - 30*86400  # rough
                    existing = conn.execute(
                        "SELECT COALESCE(SUM(reward_earned),0) FROM Transactions WHERE user_card_id=? AND tx_date>?",
                        (user_card_id, month_start)).fetchone()[0]
                    remaining = max(0, cap - existing)
                    reward = min(reward, remaining)
                break
        
        tid = "tx_" + str(uuid.uuid4())
        now = int(time.time())
        conn.execute("""INSERT INTO Transactions (id, user_id, user_card_id, merchant, category, amount,
            reward_earned, reward_rate_applied, tx_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (tid, user_id, user_card_id, merchant, category, amount, reward, rate, now, notes))
        
        # Update card aggregates
        conn.execute("""UPDATE UserCards SET outstanding_amount = outstanding_amount + ?,
            current_cycle_spend = current_cycle_spend + ?, total_rewards_earned = total_rewards_earned + ?
            WHERE id=?""", (amount, amount, reward, user_card_id))
        
        return {"id": tid, "reward_earned": reward, "reward_rate": rate}, None

def get_transactions(user_id, limit=20, offset=0, card_id=None):
    with get_conn() as conn:
        sql = """SELECT t.*, c.name as card_name, c.card_color_from, c.card_color_to
                 FROM Transactions t
                 JOIN UserCards uc ON t.user_card_id = uc.id
                 JOIN CardCatalogue c ON uc.catalogue_id = c.id
                 WHERE t.user_id=?"""
        params = [user_id]
        if card_id:
            sql += " AND t.user_card_id=?"
            params.append(card_id)
        
        total = conn.execute(f"SELECT count(*) FROM ({sql})", params).fetchone()[0]
        sql += " ORDER BY t.tx_date DESC LIMIT ? OFFSET ?"
        params += [limit, offset]
        rows = conn.execute(sql, params).fetchall()
        return {"transactions": [dict(r) for r in rows], "total": total}

def get_transaction(user_id, tx_id):
    with get_conn() as conn:
        row = conn.execute("""SELECT t.*, c.name as card_name FROM Transactions t
            JOIN UserCards uc ON t.user_card_id = uc.id
            JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE t.id=? AND t.user_id=?""", (tx_id, user_id)).fetchone()
        return dict(row) if row else None

def update_transaction(user_id, tx_id, fields):
    with get_conn() as conn:
        old = conn.execute("SELECT * FROM Transactions WHERE id=? AND user_id=?", (tx_id, user_id)).fetchone()
        if not old:
            return None
        old = dict(old)
        new_amount = fields.get("amount", old["amount"])
        amount_diff = new_amount - old["amount"]
        
        allowed = {"merchant", "category", "amount", "notes"}
        updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
        if not updates:
            return old
        updates["is_corrected"] = 1
        set_clause = ", ".join(f"{k}=?" for k in updates)
        values = list(updates.values()) + [tx_id, user_id]
        conn.execute(f"UPDATE Transactions SET {set_clause} WHERE id=? AND user_id=?", values)
        
        if amount_diff != 0:
            conn.execute("UPDATE UserCards SET outstanding_amount = outstanding_amount + ?, current_cycle_spend = current_cycle_spend + ? WHERE id=?",
                         (amount_diff, amount_diff, old["user_card_id"]))
        return {**old, **updates}

def delete_transaction(user_id, tx_id):
    with get_conn() as conn:
        tx = conn.execute("SELECT * FROM Transactions WHERE id=? AND user_id=?", (tx_id, user_id)).fetchone()
        if not tx:
            return False
        tx = dict(tx)
        conn.execute("DELETE FROM Transactions WHERE id=?", (tx_id,))
        conn.execute("""UPDATE UserCards SET outstanding_amount = outstanding_amount - ?,
            current_cycle_spend = current_cycle_spend - ?, total_rewards_earned = total_rewards_earned - ?
            WHERE id=?""", (tx["amount"], tx["amount"], tx["reward_earned"], tx["user_card_id"]))
        return True

# ─── ANALYTICS FUNCTIONS ────────────────────────────────────────────
def get_dashboard_stats(user_id):
    with get_conn() as conn:
        spend = conn.execute("SELECT COALESCE(SUM(amount),0), COALESCE(SUM(reward_earned),0) FROM Transactions WHERE user_id=?", (user_id,)).fetchone()
        card_count = conn.execute("SELECT count(*) FROM UserCards WHERE user_id=? AND is_active=1", (user_id,)).fetchone()[0]
        
        most_used = conn.execute("""SELECT c.name, COUNT(*) as cnt FROM Transactions t
            JOIN UserCards uc ON t.user_card_id = uc.id JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE t.user_id=? GROUP BY c.name ORDER BY cnt DESC LIMIT 1""", (user_id,)).fetchone()
        
        recent = conn.execute("""SELECT t.id, t.merchant, t.amount, t.reward_earned, t.tx_date, t.category,
            c.name as card_name, c.card_color_from, c.card_color_to
            FROM Transactions t JOIN UserCards uc ON t.user_card_id = uc.id
            JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE t.user_id=? ORDER BY t.tx_date DESC LIMIT 5""", (user_id,)).fetchall()
        
        # Upcoming dues: cards with outstanding > 0
        dues = conn.execute("""SELECT uc.id, uc.outstanding_amount, uc.due_day, uc.last_four_digits,
            c.name, c.card_color_from, c.card_color_to
            FROM UserCards uc JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE uc.user_id=? AND uc.is_active=1 AND uc.outstanding_amount > 0
            ORDER BY uc.due_day""", (user_id,)).fetchall()
        
        return {
            "total_spend": round(spend[0], 2),
            "total_rewards": round(spend[1], 2),
            "card_count": card_count,
            "most_used_card": most_used["name"] if most_used else "No cards used yet",
            "recent_transactions": [dict(r) for r in recent],
            "upcoming_dues": [dict(r) for r in dues]
        }

def get_spending_trends(user_id):
    with get_conn() as conn:
        rows = conn.execute("""
            SELECT strftime('%Y-%m', tx_date, 'unixepoch') as month,
                   SUM(amount) as spend, SUM(reward_earned) as rewards
            FROM Transactions WHERE user_id=?
            GROUP BY month ORDER BY month DESC LIMIT 12
        """, (user_id,)).fetchall()
        return {"monthly_data": [dict(r) for r in rows]}

def get_category_breakdown(user_id):
    with get_conn() as conn:
        total_row = conn.execute("SELECT COALESCE(SUM(amount),0) FROM Transactions WHERE user_id=?", (user_id,)).fetchone()
        total = total_row[0] if total_row[0] > 0 else 1
        
        rows = conn.execute("""SELECT category as name, SUM(amount) as amount
            FROM Transactions WHERE user_id=?
            GROUP BY category ORDER BY amount DESC""", (user_id,)).fetchall()
        
        colors = {"Travel":"#3b82f6","Dining":"#9333ea","Grocery":"#10b981","Shopping":"#ec4899",
                  "Online":"#f59e0b","Fuel":"#ef4444","Entertainment":"#8b5cf6","Other":"#6b7280"}
        
        return {"categories": [
            {"name": r["name"], "amount": round(r["amount"],2),
             "percentage": round(r["amount"]/total*100, 1),
             "color": colors.get(r["name"], "#6b7280")}
            for r in rows
        ]}

# ─── RECOMMENDATION FUNCTION ────────────────────────────────────────
def get_recommendation(user_id, merchant, category, amount):
    cards = get_user_cards(user_id)
    if not cards:
        return None
    
    best_card = None
    best_reward = -1
    best_reason = ""
    best_rate = 0
    
    for card in cards:
        rules = json.loads(card.get("reward_rules_json") or "[]")
        rate = card.get("base_reward_rate", 1.0)
        reason = f"Base {rate}% rate"
        
        # Find best matching rule
        all_rule_rate = rate
        for rule in rules:
            rc = rule.get("category", "")
            if rc == "ALL":
                all_rule_rate = rule.get("rate", rate)
                continue
            if rc.upper() == category.upper() or rc.upper() in merchant.upper():
                rate = rule.get("rate", rate)
                reason = f"{rate}% {rc} multiplier"
                break
        else:
            rate = all_rule_rate
            if all_rule_rate != card.get("base_reward_rate", 1.0):
                reason = f"Base {all_rule_rate}% on all spends"
        
        reward = round(amount * rate / 100.0, 2)
        if reward > best_reward:
            best_reward = reward
            best_card = card
            best_reason = reason
            best_rate = rate
    
    alternatives = []
    for card in cards:
        if card["id"] != best_card["id"]:
            rules = json.loads(card.get("reward_rules_json") or "[]")
            r = card.get("base_reward_rate", 1.0)
            for rule in rules:
                rc = rule.get("category", "")
                if rc.upper() == category.upper() or rc == "ALL":
                    r = rule.get("rate", r)
                    break
            alternatives.append({
                "name": card["name"], "issuer": card["issuer"],
                "reward": f"₹{round(amount * r / 100.0, 2)}",
                "reason": f"{r}% rate",
                "card_color_from": card.get("card_color_from","from-blue-800"),
                "card_color_to": card.get("card_color_to","to-blue-900")
            })
    
    return {
        "bestCard": best_card["name"],
        "bestCardIssuer": best_card["issuer"],
        "reward": f"₹{best_reward}",
        "reason": best_reason,
        "rate": best_rate,
        "card_color_from": best_card.get("card_color_from","from-blue-800"),
        "card_color_to": best_card.get("card_color_to","to-blue-900"),
        "alternatives": alternatives,
        "capImpact": "Within limits"
    }

# ─── ALERTS FUNCTIONS ────────────────────────────────────────────────
def generate_alerts(user_id):
    with get_conn() as conn:
        now = int(time.time())
        # Due date alerts for cards with outstanding
        cards = conn.execute("""SELECT uc.id, uc.outstanding_amount, uc.due_day, c.name
            FROM UserCards uc JOIN CardCatalogue c ON uc.catalogue_id = c.id
            WHERE uc.user_id=? AND uc.is_active=1 AND uc.outstanding_amount > 0""", (user_id,)).fetchall()
        
        for card in cards:
            existing = conn.execute("SELECT id FROM Alerts WHERE user_id=? AND related_card_id=? AND alert_type='DUE_DATE' AND is_read=0",
                                    (user_id, card["id"])).fetchone()
            if not existing:
                aid = "alert_" + str(uuid.uuid4())
                conn.execute("""INSERT INTO Alerts (id, user_id, alert_type, title, message, severity, created_at, related_card_id)
                    VALUES (?, ?, 'DUE_DATE', ?, ?, 'warning', ?, ?)""",
                    (aid, user_id, f"Payment Due - {card['name']}",
                     f"₹{card['outstanding_amount']:,.0f} outstanding on your {card['name']}. Due by day {card['due_day']} of this month.",
                     now, card["id"]))

def get_alerts(user_id):
    generate_alerts(user_id)
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM Alerts WHERE user_id=? ORDER BY created_at DESC LIMIT 50", (user_id,)).fetchall()
        return [dict(r) for r in rows]

def mark_alert_read(user_id, alert_id):
    with get_conn() as conn:
        conn.execute("UPDATE Alerts SET is_read=1 WHERE id=? AND user_id=?", (alert_id, user_id))
