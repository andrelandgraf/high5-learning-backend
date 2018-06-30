## Info
This is the backend repository for the 
elearning platform high-five-learning. 

This is a project of four TUM students of the course: 
Software Engineering für betriebliche Anwendungen – Masterkurs: 
Web Application Engineering (IN2087)

You can find the corresponding frontend here:
https://github.com/tum-aweink/high5-learning-frontend

## Prerequisites

**Install node dependencies and MongoDB**

```
npm install
```

## Start the project

**Starting MongoDB**
```bash
mongod --dbpath "Your/Database/Path" 
```

**Only once: Load MongoDB dump**
```bash
mongorestore /dump
```

**Development environment**
```bash
npm run devstart
```

**Production environment**
```bash
npm start
```

## Testing High Five Learning 

**Load dump data first**

**Use following license code to register as a teacher**
```
school name: Disney High School
license code: DisneyHighSchoolLicenseCode2018
```

**Use following teacher account to test teacher's functionalities**
```
user account email: dagoberg.duck@disney.com
password: bla
```

**Use following student account to test student's functionalities**
```
user account email: donald.duck@disney.com
password: bla
```