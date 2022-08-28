 Command |  Name  | Description
---------|--------|------------
`0`-`9`  |Push `n`| Pushes `n` to the stack.
`+`      |Add     | Pops `a` and then `b`. Pushes `a+b`.
`-`      |Subtract| Pops `a` and then `b`. Pushes `a-b`.
`*`      |Multiply| Pops `a` and then `b`. Pushes `a*b`.
`/`      |Divide  | Pops `a` and then `b`. Pushes `a-b`.
`%`      |Modulo  | Pops `a` and then `b`. Pushes `a%b` (The remainder of `/b`).
`!`      |Not     | Pops `n`. If `n` is `0`, Pushes `1`. Otherwise, pushes `0`.
`` ` ``  |Greater | Pops `a` and then `b`. Pushes `1` if `a > b`.
`>`      |Right   | Makes the command pointer move to the right.
`<`      |Left    | Makes the command pointer move to the left.
`^`      |Up      | Makes the command pointer move upwards.
`v`      |Down    | Makes the command pointer move downwards.
`?`      |Random  | Makes the command pointer move in a random cardinal direction.
`_`      |H Logic | Pops `n`. If `n` is `0`, moves right. Otherwise, moves left.
`|`      |V Logic | Pops `n`. If `n` is `0`, moves up. Otherwise, moves down.
`"`      |String  | All characters until the next `"` have their ASCII values pushed to the stack.
`:`      |Clone   | Pops `n`. Pushes `n` twice.
`\`      |Swap    | Pops `a` and then `b`. Pushes `a` and then `b`. This swaps the top 2 items of the stack.
`$`      |Discard | Pops `n`. Does nothing.
`.`      |N Out   | Pops `n`. Writes `n` to the output as a number followed by a space.
`,`      |A Out   | Pops `a`. Writes `a` to the output as an ascii character.
`#`      |Bridge  | Moves the pointer forward, which skips the cell next to the bridge.
`p`      |Put     | Pops `y`, `x`, and then `v`. Sets the cell at `x, y` to `v`.
`g`      |Get     | Pops `y` and then `x`. Pushes the value of the cell at `x, y` to the stack.
`&`      |N in    | Requests a number from the user and pushes it to the stack.
`~`      |A in    | Requests an ASCII character from the user and pushes it to the stack.
`@`      |End     | Immediately stops the execution of the program.

## Extended commands
These commands are exclusive to FungeYear.
Command |  Name  | Description
--------|--------|------------
`'`     |Less    | Pos `a` and then `b`. Pushes `1` if `a < b`.
`[`     |L Shift | Removes `n` from the bottom of the stack. Pushes `n` to the stack.
`]`     |R Shift | Pops `n` from the stack. Pushes `n` to the bottom of the stack.
`{...}` |Compose | Makes a number from the digits inside and pushes it to the stack.
`(`     |S Swap  | Pops `n` from the stack. Stores `n` in the `swap` variable.
`)`     |G Swap  | Pushes the value in the `swap` variable to the stack. Clears the `swap` variable.
`;`     |Length  | Pushes the length of the stack(before this push) to the stack.
`f`     |Find    | Pops `i` from the stack. Pushes the item `n` items from the top of the stack to the stack.
`w`     |Write   | Continuously pops `a` from the stack. If `a` is `0`, breaks from the loop. Otherwise, Prints `a` as ASCII. This does not leave behind a `0` on the stack.
`c`     |Color   | Pops `r`, `g`, and then `b`. Prints an ANSI code that sets the text color to the given `rgb` value.
`e`     |Empty   | Empties the output.
`a`     |A str in| Asks the user for a string of text. Pushes the given text by character to the stack such that it is backwards. This means that using `w` immediately after this command will print the text in the order it was written.
`=`     |Heap    | (EXPERIMENTAL). Makes several other commands interact with the heap, which is a tape of cells that all default to `0`. Heap space must manually be allocated.
`𓅱`     |BFE     | A bird from egypt prints "𓅱" followed by a newline.