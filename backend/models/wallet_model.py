WALLET_TABLE = {
    "wallet_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT UNIQUE NOT NULL (FK -> users)",
    "balance": "DECIMAL(10,2) NOT NULL DEFAULT 0.00",
    "status": "ENUM('active', 'frozen', 'closed') NOT NULL DEFAULT 'active'",
    "created_at": "DATETIME DEFAULT CURRENT_TIMESTAMP",
    "updated_at": "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
}

TRANSACTION_LOG_TABLE = {
    "transaction_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "wallet_id": "INT NOT NULL (FK -> wallets)",
    "transaction_type": "ENUM('deposit', 'withdrawal', 'payment', 'refund', 'platform_fee', 'tutor_earnings') NOT NULL",
    "amount": "DECIMAL(10,2) NOT NULL",
    "balance_after": "DECIMAL(10,2) NOT NULL",
    "reference_type": "ENUM('application', 'withdrawal_request', 'deposit_slip') NULL",
    "reference_id": "INT NULL",
    "description": "VARCHAR(255) NULL",
    "transaction_date": "DATETIME DEFAULT CURRENT_TIMESTAMP"
}
