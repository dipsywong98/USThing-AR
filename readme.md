# USThing-AR

Academic requirement parser

### Get start

clone this project

```sh
npm i     # install
node index.js path-to-ar.html # output the json
mocha     # run test
```

### Usage

check `src/index.js`, which input an HTML string, output the javascript object

### Format

```
Output: [Requirement]
```

```
Requirement: {
  name: String
  rg: Number
  descriptions: [String]
  units: Unit
  courses: Course
  gpa: GPA
  satisfied: Boolean
  areas: [Area]
  criteria: [Criterion]
}
```

```
Area: {
  name: String
  descriptions: [String]
  units: Unit
  courses: Course
  gpa: GPA
  satisfied: Boolean
  criteria: [Criterion]
}
```

```
Criterion: {
  name: String
  descriptions: [String]
  units: Unit
  courses: Course
  gpa: GPA
  satisfied: Boolean
  courseList: [Course]
}
```

```
Course: {
  course: String
  description: String
  units: Number
  when: String
  grade: String
  status: ''|'In Progress'|'Taken'
}
```

```
Unit: {
  required: Number
  taken: Number
  needed: Number
}
Courses: {
  required: Number
  taken: Number
  needed: Number
}
GPA: {
  required: Number
  current: Number
}
```
