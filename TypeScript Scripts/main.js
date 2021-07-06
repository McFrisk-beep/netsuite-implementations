"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var message = 'Welcome back';
console.log(message);
var checker = true;
var multiplier = 3;
var details = "The multiplier is " + multiplier + ".\nThis string also supports multiple lines.\nAs you can see.";
console.log(details);
var freeArray = [1, 2, 3];
var numberArray = [4, 5, 6];
var Color;
(function (Color) {
    Color[Color["Red"] = 5] = "Red";
    Color[Color["Green"] = 6] = "Green";
    Color[Color["Blue"] = 7] = "Blue";
})(Color || (Color = {}));
;
var c = Color.Green;
console.log(c); //Displays 6.
var randomValue = 10;
randomValue = false;
randomValue = 'Hello world';
//Can add a variable-specific parameter. In this instance, a parameter of type 'number'
//To make the parameter optional, add a question mark at the end of the parameter name
function add(num1, num2) {
    if (num2)
        return num1 + num2;
    else
        return num1;
}
add(5, 10);
function fullName(person) {
    console.log(person.firstName + " " + person.lastName);
}
var p = {
    firstName: 'Adam'
};
fullName(p);
//Classes in TypeScript
var Employee = /** @class */ (function () {
    //private employeeName: string
    //protected employeeName: string;
    function Employee(name) {
        this.employeeName = name;
    }
    Employee.prototype.greet = function () {
        console.log("Good morning " + this.employeeName);
    };
    return Employee;
}());
var newEmployee = new Employee('David');
console.log(newEmployee.employeeName);
newEmployee.greet();
//Class inheritance in TypeScript
var Manager = /** @class */ (function (_super) {
    __extends(Manager, _super);
    //Calls the Employee class to initialize the employeeName (which the 'super' function does)
    function Manager(managerName) {
        return _super.call(this, managerName) || this;
    }
    Manager.prototype.delegateWork = function () {
        console.log("Manager delegating tasks");
    };
    return Manager;
}(Employee));
var newManager = new Manager('Luke');
newManager.delegateWork();
newManager.greet();
console.log(newManager.employeeName);
