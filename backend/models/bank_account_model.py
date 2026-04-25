USER_BANK_ACCOUNT_TABLE = {
    "bank_account_id": "INT PRIMARY KEY AUTO_INCREMENT",
    "user_id": "INT NOT NULL (FK -> users)",
    "bank_name": "VARCHAR(100) NOT NULL",
    "account_number": "VARCHAR(20) NOT NULL",
    "account_name": "VARCHAR(100) NOT NULL",
    "is_primary": "BOOLEAN DEFAULT FALSE"
}
