-- Bad SurrealDB patterns — all should FAIL

-- ERROR: type::thing() renamed to type::record()
LET $user = type::thing('user', $id);

-- ERROR: <future> removed, use COMPUTED
DEFINE FIELD full_name ON user VALUE <future> { string::concat(first_name, ' ', last_name) };

-- ERROR: DEFINE SCOPE replaced by DEFINE ACCESS
DEFINE SCOPE account SESSION 24h;

-- ERROR: type::is:: renamed to type::is_
LET $check = type::is::string($value);

-- ERROR: rand::guid() renamed to rand::id()
LET $new_id = rand::guid();

-- ERROR: bare assignment without LET
$total = 10;
