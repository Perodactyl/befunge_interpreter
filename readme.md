# FungeYear Befunge Interpreter
<br>
A simple befunge-93 interpreter written in JavaScript. It has some advanced features that are not available in the original Befunge-93.


[Befunge-93 on Wikipedia](https://en.wikipedia.org/wiki/Befunge-93)

# Advanced features:
- ; - Push Stack Length to Stack
- {number} - Compose number by digits
- [ & ] - Rotate Stack
- ( - Pop stack and set SWAP value
- ) - Push SWAP value to stack and clear
- ANSI Code support in Output

<sub>This list is not updated frequently. See `commands.md` for more info.</sub>

# Instructions:
<br>
Write your program in the 80x25 grid to the left. The Middle column is the stack and this column is the output. (This is ripped from the file itself, it's got an identical description.)
<br>
Choose the speed to play at and hit "Start". This generates an iterator that you can use to step through the program or run the program at the given speed.

# Controls:

You can use the pluspad below to set the writing direction. The "Auto" button makes the editor change the writing direction when you type a directional character.

"Leaping" will skip over empty spaces when running the program.

You can export and import programs by using the "Export" button, copying the text in the output box, and pasting it in after using the "Import" button.

There are several examples you can choose from below. You can also choose what to do when an error is encountered.
- Ignore: Nothing happens when an error is encountered. This may cause seemingly unexpected behavior.
- Loose: The program will output that an error occured and continue.
- Strict: The program will output that an error occured and stop.
<br>
You can find this project on github pages at https://perodactyl.github.io/fungeyear_befunge_interpreter/