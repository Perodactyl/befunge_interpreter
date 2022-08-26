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
Any time you write text, it will be put at the cell highlighted blue in the grid. Use the "pluspad" to set your writing direction. When auto is selected, directional instructions will change the direction. Use shift+arrow to set your writing direction. Page Up, Page Down, Home, and End will move the cursor to the edges of the grid.

When you are ready to run the code, set the speed you want to run it at and hit start. Use the step, stop, and play/pause buttons to control the execution.

Programs can be exported or imported. Currently, you cannot import text. Export codes are run-length encoded. Exporting by columns will scan from left to right when importing and exporting, whereas exporting by rows scans vertically downwards.

There are several examples in a dropdown to choose from. After you choose, press the button to load that example.

Error handling allows you to change what the interpreter does when an error is encounted. By default, this is set to "loose".
- Ignore: Nothing happens when an error occurs. This may cause unexpected behavior because the interpreter will make all errors recoverable.
- Loose: An error is printed to the console in red. This may change the ANSI style that is currently set for your output.
- Strict: Same as Loose, but the execution ends upon an error.

<br>
You can find this project on github pages at https://perodactyl.github.io/fungeyear_befunge_interpreter/