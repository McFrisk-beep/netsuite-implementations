export {}
let message = 'Welcome back';
console.log(message);

let checker: boolean = true;
let multiplier: number = 3;
let details: string = `The multiplier is ${multiplier}.
This string also supports multiple lines.
As you can see.`;
console.log(details);

let freeArray: number[] = [1,2,3];
let numberArray: Array<number> = [4,5,6];

enum Color {Red = 5, Green, Blue};
let c: Color = Color.Green;
console.log(c); //Displays 6.

let randomValue: any = 10;
randomValue = false;
randomValue = 'Hello world';

//Can add a variable-specific parameter. In this instance, a parameter of type 'number'
//To make the parameter optional, add a question mark at the end of the parameter name
function add(num1: number, num2?: number){
    if(num2)
        return num1 + num2;
    else
        return num1;
}

add(5, 10);

//Interfacing in TypeScript
interface Person{
    firstName: string;
    lastName?: string;
}

function fullName(person: Person){
    console.log(`${person.firstName} ${person.lastName}`);
}

let p = {
    firstName: 'Adam'
};

fullName(p);

//Classes in TypeScript
class Employee {
    //Access modifiers
    //By default, each classes are public. Although they can be explicitly specified.
    //public - accessible by anything, protected - accessible to current class and child class, private - accessible to current class

    public employeeName: string;
    //private employeeName: string
    //protected employeeName: string;

    constructor(name: string){
        this.employeeName = name;
    }

    greet(){
        console.log(`Good morning ${this.employeeName}`);
    }
}

let newEmployee = new Employee('David');
console.log(newEmployee.employeeName);
newEmployee.greet();

//Class inheritance in TypeScript
class Manager extends Employee{

    //Calls the Employee class to initialize the employeeName (which the 'super' function does)
    constructor(managerName: string){
        super(managerName);
    }

    delegateWork(){
        console.log(`Manager delegating tasks`);
    }
}

let newManager = new Manager('Luke');
newManager.delegateWork();
newManager.greet();
console.log(newManager.employeeName);