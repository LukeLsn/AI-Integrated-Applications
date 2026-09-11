The Basics
This section looks at the basics of Python programming.

Interpreted vs Compiled
Python is both interpreted and compiled but these terms are complicated. JavaScript is an example of an interpreted language, where the source gets turned into machine language as it runs. C/C++ are examples of languages that are compiled. When you run a c++ compiler, the program doesn't actually run, instead it translates your c++ code into executable that you can then run.

However Python is a little different. You can run a Python program without ever compiling it. You can also compile a Python program but what you get isn't an executable in the C/C++ sense which is compiled for your machine. Instead, you get the program translated into bytecode. When you run the compiled program, that byte code is translated into your computer's machine language.

The Python Shell
The Python shell allows you to run python code without saving it to a file. It can be a quick way for you to test out some snippet of code. You can spin up a python shell by typing python at the command prompt

Comments
Use # at start of line to create a comment

# this is a comment

Basic Types and Variables
In C, when you declare a variable you have to state the data type of that variable. You think about the variable as a name for an area of memory that can hold stuff.

Unlike C, it is better to think of variables in python as labels. All variables have a value association with it, you don't just go around declaring storage like you do in C.

Naming rules:
Here are the naming rules:

you can use letters, numbers and underscores in names
variables names begin with letters and underscores, never numbers
spacing is not allowed in variable names
avoid python keywords for variable names
Naming Conventions:

use snake case this_is_a_variable_name
use lower case for variable names
use ALLCAPS for constants.
capitalize first word of class names without using _ between ThisIsAClassName
Strings
Strings are created by using either double quotes or single quotes:

"this is a string"
'this is also a string'

Since both are strings, the one you use could depend on what you want to say. For example, if your statement involves an apostrophes, use double quotes

"Python's string declarations are neato!"

Similarly you if you need to use double quotes in your string, you can use single quotes to declare it

'"Coffee is a way of stealing time that should by rights belong to your older self" - Terry Pratchett'

If you need both.. you will need to use the escape \ character

"\"It’s still magic even if you know how it’s done\" - Terry Pratchett"


Numbers
Just like C/C++ you can have integers or floating point values. Unlike C/C++ you don't specify the number of bits used to represent the numbers.

To create an integer, write a number without decimal points

x = 5

x is an integer

To create a floating point add a decimal point

y = 5.0

y is a floating point

Numeric Operators
The following mathematical operators are available

+ - addtion
- - subtraction
* - multiplication
/ - division
// - integer division
% - modulus
** - exponent
Mathematical expressions
Mathematical expressions follow most of the same rules as C/C++ but there are some differences:

when using dividing 2 integers, C/C++ truncates the decimal points 14/5 = 2 for example. Python results in the floating point result of the division. 14/5 = 2.8
the modulo operation % following proper mathematical mod rules when dealing with negative values. In C/C++ it just negates the results. thus -9 % 5 = -4. In python, -9 % 5 = 1, because -9/5 = -1.8, taking the floor of this gives -2. -2 * 5 + 1 = -9
you can use _ to make it easier to specify the number x = 1_000_000_000 for example to specify 1 billion.
Selection
In general python selection is done using if/else type of statements. Pre python 3.10 there are no equivalency of a switch statement. It is recommended that you keep to the if/else type of construct for selection.

In Python, indentation really matters. there are no brackets. If you want something to be part of an if block, make sure they are indented the same way inside the if statement.

For example, in C if you wrote:

x=5;
if(x == 3)
	printf("bananas\n");
	printf("oranges\n");

the result output would be:

oranges

the indentation doesn't matter. You would normally wrap it all up using if you wanted to have both statements to be done when x == 3.

In python there are no brackets. Instead, if you indent both statements then they are part of the if block. If you don't indent the second statement then it is not.

Boolean expressions
Boolean expressions are thing that evaluate to True or False. Values of basic types can be compared using the same comparison operators as C/C++. For strings, the comparison is alphabetical ordering, thus "apple" < "banana", but "Banana" < "apple" (because "B" comes before "a")

Boolean operators:

In C/C++ the boolean operators &&, ||, ! are replaced by and, or , not

zero vs non-zero
zero is false, everything else is true. This is same as C/C++

Lazy Evaluation
Similar to C/C++, the boolean operators are lazily tested. This means that for a boolean expression that uses an and expression, if the left operand is false, the right operand will not be evaluated because the entire boolean expression can never be true

Similarly when given an expression that uses an or expression, if the left operand is true, the right operand will not be evaluated because the entire boolean expression will never be false

def truthy():
    print("it's true!")
    return True

def falsey():
    print("it's false!")
    return False

print ("true or false result: ")
truthy() or falsey()

print("\nfalse or true result: ")
falsey() or truthy()

print ("\ntrue and false result: ")
truthy() and falsey()

print("\nfalse and true result: ")
falsey() and truthy()



results in:

true or false result:
it's true!

false or true result:
it's false!
it's true!

true and false result:
it's true!
it's false!

false and true result:
it's false!

Syntax:
An if statement

if <boolean expression>:
	statement1
	statement2
	...

if/else statement

if <boolean expression>:
	statement1
	statement2
	...
else:
	statement3
	statement4
	...

if/else if/else if/...else

if <boolean expression>:
	statement1
	statement2
	...
elif <boolean expression>:
	statement3
	statement4
	...
elif <boolean expression>:
	statement5
	statement6
	...
...
else:
	statement7
	statement8
	...

Lists
This is similar in nature to C++ arrays but also quite different at the same time.

Unlike C++ arrays, when you declare a list, you do not specify a capacity. As you add items, the list will grow as needed.

To use a list, declare a variable and initialize it with a list of values:

my_list = [0, 2 , 3]

The other major difference between lists in Python and arrays in C++ is that items in Python lists can be of different types. For example, in C++, you cannot store integers and strings in the different elements of the same array. Every element must be of the same type.

In Python, every element in the list can have a different type.

my_list = [1 , 2 , "hello", "world", 1.5]

To access a particular element, you index into the list. Indexing starts at 0 just like in C

my_list = [1 , 2 , "hello", "world", 1.5]
print(my_list[3])

This above code will output:

world

list assignments
When you assign a variable list to another list variable, duplicates are not made, instead they are simply different names refering to the same list. This is similar to how we might think about array assignments in C/C++

list1 = [1,2,3,4]
list2 = list1
list2[1] = 50
print(list1)  # output: [1, 50, 3, 4]


both list1 and list2 refer to the same list so any changes made through one list, the other list is also modified

Dictionaries
A dictionary is a set of key-value pairs. To create a dictionary. Syntactically it resembles the definition of JavaScript objects. The keys can be any basic types, strings or numbers

my_dictionary = {<key1>:<value>, <key2>:<value>...}
print(my_dictionary)

A dictionary lets you find values based on keys quickly.

my_dictionary = {"key1": 5, "key2":6, 7:15}
print(my_dictionary["key1"])  # output 5


You can add to a dictionary by assignment

my_dictionary = {"key1": 5, "key2":6}
my_dictionary["key3"] = 7
print(my_dictionary["key3"])  # output 7


Iteration
For Loops
A for loop is a counting loop in python.

for variable in range(start,end):
	...

The above for loop is equivalent to the following in C/C++

for(int variable = start;variable < end; variable++){
	...
}

Furthermore, you can also use it to iterate through lists:

my_list=[5, 4, 3, 2, 1]

for number in my_list:
	print(number)

While Loops
i = 1

while i < 10:
  print(i)
  i += 1

A while loop can be very useful when there is no clear end... for example, if you were trying to do interactive input until some criteria is met.

Functions
To declare a function in python use the following syntax

def function_name(argument_list):
	...

You can call the function by using the function name and supplying arguments to the function

Classes
Classes allow you to create objects in python. There are however some subtle differences in python

In python classes there is a special function that is used to initialize and define the data within the class. So looking at code below, you will notice that the data members are effectively declared in a special function called __init__

The function is named init with two underscores before and after the word. The keyword self is the first argument followed by an argument list.

class ClassName:
	def __init__(self, argument_list):
		self.attribute1 = ...   # this is the equivalent of data members
		self.attribute2 = ...   # in c++

	def function1(self, arguments):  # this is the way we define member functions
		...

You can create an inherited class in python by passing the base class into the class declaration of the derived class.


class BaseClass:
	def __init__(self, argument_list):
		self.attribute1 = ...
		self.attribute2 = ...

	def function1(self, arguments):
		...

class DerivedClass(BaseClass):
	def __init__(self, argument_list):
		super().__init__(arguments_for_attribute1_and_attribute2)    # notice you don't use self in this call
		self.attribute3 = ...

	def function1(self, arguments):
		... # overrides base class function

	def function2(self, arguments):
		... # new function exclusive to derived class
