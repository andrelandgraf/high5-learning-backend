## Prerequisites

**Install node dependencies**

```
npm install
```

## Start the project

**Development environment**
```bash
npm run devstart
```

**Production environment**
```bash
npm start
```

get /classes  -> all classes for this user
get /classes/:id -> :id is id of class, gives all homework of this class + class meta data
get /homework/:id -> :id is id of homework, gives all exercises of this home + homework meta data
post /classes/ -> creates new class, returns password and id (url of this new class is classes/:id)
post /homework/ -> creates new homework + new exercises for this homework 
post /submissions/ -> 
