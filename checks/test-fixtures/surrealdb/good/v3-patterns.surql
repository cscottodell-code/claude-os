-- Good SurrealDB v3 patterns — all should PASS

DEFINE TABLE user SCHEMAFULL;
DEFINE FIELD name ON user TYPE string;
DEFINE FIELD email ON user TYPE string;

-- v3 record constructor
LET $user = type::record('user', $id);

-- v3 computed field
DEFINE FIELD full_name ON user COMPUTED string::concat(first_name, ' ', last_name);

-- v3 access definition
DEFINE ACCESS account ON DATABASE TYPE RECORD
  SIGNUP ( CREATE user SET email = $email, pass = crypto::argon2::generate($pass) )
  SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(pass, $pass) )
  DURATION FOR TOKEN 15m, FOR SESSION 12h;

-- v3 variable declaration
LET $total = (SELECT count() FROM user GROUP ALL)[0].count;

-- v3 random ID
LET $new_id = rand::id();
