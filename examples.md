 Name | Extended | Description
 -----|----------|------------
 Hello World | False | Prints "Hello, World!" to the console, followed by a newline. Loops.
 Visible Characters | False | Prints several visible ASCII characters, from space to tilde.
 Queue Visible Characters | False | Same as "Visible Characters", but puts all characters in the stack before printing them.
 Blank Canvas | False | A completely empty space. Does nothing.
 Random 1-3 | False | Pushes 1, 2, or 3 to the stack. Loops.
 Count to 99 | False | Prints every number from 1 to 99.
 Endless Counter | False | Counts from 0 up.
 ANSI Code | False | Prints "Hi there!" with ANSI codes so that it looks like barf. Useful as an example that shows that ANSI codes are supported.
 Truth Machine | False | Takes input. If the input is 0, it prints 0 and halts. If the input is 1, it repeats infinite 1s until stopped.
 Single-Stack Hello World | False | Prints "Hello, World!" while only using one stack item. Loops.
 Shifting Hello World | True - Shift Left + Compose | Prints "Hello, World!" using shifting so that it prints in reverse order. Prints a newline using the compose instruction. Loops.
 Compose Count to 99 | True - Compose | Same as "Count to 99", but uses number composition to check whether the loop should be exited.
 Length-Based Counter | True - Length | Same as "Endless Counter", but increases the stack length and uses the length operation to count up.
 String Printer | True - Shift Left | Prints the text in the first line. Uses shifting similar to "Shifting Hello World".
 Looping String Printer | True - Shift Left | Same as "String Printer", but it loops with a newline after it finishes printing.
 Length-Based String Printer | True - Shift Left + Length | Similar to "String Printer", but it uses the number of items on the stack to determine whether to exit.
 Looping Length-Based String Printer | True - Shift Left + Length | Combines "Looping Strin Printer" and "Length-Based String Printer".
 Heap Hello World | True - Heap (EXPERIMENTAL) | Prints "Hello, World!" using the heap.
 Calculator | True - Shift Right | Asks for a, operation, and b. Prints the result.
 Better Calculator | True - Shift Right + Shift Left | A better calculator. Can solve A+B, A-B, A*B, A/B, A%B, A>B, A&lt;B, A=B, A^2, A^3, A^B, and A!. Easily Extensible.
 Looping Better Calculator | True - Shift Right + Shift Left | Like "Better Calculator", but the exit instruction is replaced with a loop.
 99 Bottles of Beer | True - Compose | Prints the lyrics of "99 Bottles of Beer on the Wall". Takes forever.
 Faster 99 Bottles of Beer | True - Compose + Write | Like "99 Bottles of Beer", but faster. Uses the "w" command to print text much faster than using a print loop.
 CAT (echo) | True - Shift Left | Takes a string of input. Outputs the given input.
 Number Guessing Game | True - Shift Left + Write | Has a terrible RNG. Allows you to guess a number. Tells you "Too Low!" or "Too High!" if you were incorrect. Otherwise, says "You Win!" and terminates.
