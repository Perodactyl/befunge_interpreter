let body = $("#body");
let status = $("#status");
let output_el = $("#output");
let ansi_up = new AnsiUp(); //Converts ANSI to HTML

let board = []; //! ATTENTION! Board is an array to be indexed Y BEFORE X. (array of columns)
let board_width = 80;
let board_height = 25;
for (let i = 0; i < board_height; i++) {
	board[i] = [];
	for (let j = 0; j < board_width; j++) {
		board[i][j] = "";
	}
}
function create_table_row(row, y) { //Converts an array into a table row
	let row_html = `<tr data-y="${y}">`;
	for (let i = 0; i < row.length; i++) {
		row_html += `<td data-x="${i}" data-y="${y}">` + row[i] + "</td>";
	}
	row_html += "</tr>";
	return row_html;
}
function range(start, end) { //Creates an array of numbers from start to end
	return {
		current: start,
		end: end,
		start: start,
		[Symbol.iterator]: function* () {
			while (this.current <= this.end) {
				yield this.current++;
			}
		}
	}
}
//Create the body of the table
body.append(create_table_row([...range(0, board_width)], -1))
board.forEach(function (row, index) {
	body.append(create_table_row([index+1, ...row], index));
});
function get_cell_html(x, y){
	return body.children("tr").eq(y+1).children("td").eq(x+1);
}
let selected_cell_x = 0;
let selected_cell_y = 0;
let valid_keys = [
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", //Numbers - Pushes value to stack
	"+", "-", "*", "/", "%", //Arithmetic operators - Pops two values, performs operation, pushes result to stack
	"!", //Logical not - Pops value, inverts it, pushes result to stack
	"`", //Greater than - Pops two values, pushes 1 if first is greater than second, pushes 0 otherwise
	">", "<", "^", "v", //Directional control - Sets the direction the interpteter head travels
	"?", "_", "|", //Directional logic - Decides direction based on logic
	"\"", //Quote - Activates string mode, which reads characters onto stack until it sees another quote
	":", "\\", //Stack control - Operations that affect the data on the stack
	"$", //Discard - Pops value from stack and discards it
	".", ",", //Output - Pops value from stack and outputs it in some way
	"#", //Bridge - Skips next instruction
	"p", //Put - Modify the value of a cell. Uses two values(y and x) to locate cell and a third for the ascii value to set it to
	"g", //Get - Get the value of a cell. Pops Y followed by X and pushes the value of that cell
	"&", //Num - Asks the user for a number and pushes it to the stack
	"~", //Char - Asks the user for a character and pushes it to the stack
	"@", //End - Ends the program
	" ", //no-op
]
//Add a handler to each cell
$("#body tr:not(:first-child) > td:not(:first-child)").each(function (index, cell) {
	$(cell).on("click", function () {
		set_selected_cell($(cell).data("x")-1, $(cell).data("y")); //Subtract 1 from x to account for the header
	});
})
function set_selected_cell(x, y){
	//Wrap edges
	if(x < 0){
		x = board_width + x;
	}
	if(y < 0){
		y = board_height + y;
	}
	if(x >= board_width){
		x = x - board_width;
	}
	if(y >= board_height){
		y = y - board_height;
	}
	var o = get_cell_html(selected_cell_x, selected_cell_y).removeClass("selected");
	//If the old cell was an uncertain directional cell, make the direction temporary.
	if(o.text() == "|" || o.text() == "_" || o.text() == "?"){
		activate_pluspad_dir("center");
		is_dir_temporary = true;
	}
	selected_cell_x = x;
	selected_cell_y = y;
	var c = get_cell_html(selected_cell_x, selected_cell_y).addClass("selected");
}
function set_selected_conts(val){
	var el = get_cell_html(selected_cell_x, selected_cell_y);
	if(el.text() != val || board[selected_cell_y][selected_cell_x] != val){
		has_modified_board = true;
	}
	el.text(val);
	board[selected_cell_y][selected_cell_x] = val;
	el.attr("data-syntax-highlight", val);
}
//The direction to move the cursor in (writing mode)
let repos_dir_x = 1;
let repos_dir_y = 0;
function activate_pluspad_dir(dir, req_auto=true){
	if(req_auto && !$("#auto").hasClass("selected")){
		return;
	}
	$("#pluspad td:not(.non-dir)").removeClass("selected");
	let cell = $(`#pluspad-${dir}`);
	cell.addClass("selected");
	repos_dir_x = Number(cell.data("x"));
	repos_dir_y = Number(cell.data("y"));
}
$("#pluspad td:not(.non-dir)").each(function (index, cell) {
	$(cell).on("click", function () {
		activate_pluspad_dir($(cell).data("dir"), false);
	});
});
$("#pluspad td.toggle").each(function (index, cell) {
	$(cell).on("click", function () {
		$(cell).toggleClass("selected");
		update_settings(); //Rewrite the values to local storage
	});
});
let is_dir_temporary = false;
//Add a handler to the body
$(document.body).on("keydown", function (e) {
	let key = e.key;
	if(key == "Enter"){
		set_selected_cell(selected_cell_x, selected_cell_y+1);
	}else if(key == "Backspace"){
		set_selected_cell(selected_cell_x-repos_dir_x, selected_cell_y-repos_dir_y);
		set_selected_conts("");
	}else if(key == "Delete"){
		set_selected_conts("");
	}else if(key == "ArrowUp" && !e.shiftKey){
		set_selected_cell(selected_cell_x, selected_cell_y-1);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("up");
		}
	}else if(key == "ArrowUp"){
		activate_pluspad_dir("up", false);
		e.preventDefault();
	}else if(key == "ArrowDown" && !e.shiftKey){
		set_selected_cell(selected_cell_x, selected_cell_y+1);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("down");
		}
	}else if(key == "ArrowDown"){
		activate_pluspad_dir("down", false);
		e.preventDefault();
	}else if(key == "ArrowLeft" && !e.shiftKey){
		set_selected_cell(selected_cell_x-1, selected_cell_y);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("left");
		}
	}else if(key == "ArrowLeft"){
		activate_pluspad_dir("left", false);
		e.preventDefault();
	}else if(key == "ArrowRight" && !e.shiftKey){
		set_selected_cell(selected_cell_x+1, selected_cell_y);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("right");
		}
	}else if(key == "ArrowRight"){
		activate_pluspad_dir("right", false);
		e.preventDefault();
	}else if(key == " "){
		set_selected_conts("");
		set_selected_cell(selected_cell_x+repos_dir_x, selected_cell_y+repos_dir_y);
	}else if(key == "Tab"){
		
	}else if(key == "Home"){
		set_selected_cell(0, selected_cell_y);
	}else if(key == "End"){
		set_selected_cell(board_width-1, selected_cell_y);
	}else if(key == "PageUp"){
		set_selected_cell(selected_cell_x, 0);
	}else if(key == "PageDown"){
		set_selected_cell(selected_cell_x, board_height-1);
	}else if(key == "Control"){
		activate_pluspad_dir("center");
		is_dir_temporary = true;
	}else if(key == "Shift" || key == "Alt" || key == "Meta" || key.match(/F\d+/)){ //Ignore Fn keys and modifiers

	}else if(key.length == 1){
		set_selected_conts(key);
		if(key == "<"){
			activate_pluspad_dir("left");
		}else if(key == ">"){
			activate_pluspad_dir("right");
		}else if(key == "^"){
			activate_pluspad_dir("up");
		}else if(key == "v"){
			activate_pluspad_dir("down");
		}else if(key == "|" || key == "?" || key == "_"){ //Keys that change the direction of the cursor in a non-static way
			activate_pluspad_dir("center");
			is_dir_temporary = true; //The direction will switch the moment an arrow key is pressed
		}
		set_selected_cell(selected_cell_x+repos_dir_x, selected_cell_y+repos_dir_y);
	}else{
		console.log(`Unknown key: ${key}`);
	}
});
const sleep = (ms)=>new Promise(resolve=>setTimeout(resolve,ms));
function char(code){
	if(code < 0){
		return "[NEG]";
	}
	var char = String.fromCharCode(code);
	switch(char){
		case " ":
			return "[SPC]";
		case "\0":
			return "[NUL]";
		case "\t":
			return "[TAB]";
		case "\n":
			return "[LF]";
		case "\r":
			return "[CR]";
		case "\b":
			return "[BSP]";
		case "\x7f":
			return "[DEL]";
		case "\v":
			return "[VT]";
		case "\f":
			return "[FF]";
		case "\x1b":
			return "[ESC]";
		case "\x1c":
			return "[FS]";
		case "\x1d":
			return "[GS]";
		case "\x1e":
			return "[RS]";
		case "\x1f":
			return "[US]";
		case "\x01":
			return "[SOH]";
		case "\x02":
			return "[STX]";
		case "\x03":
			return "[ETX]";
		case "\x04":
			return "[EOT]";
		case "\x05":
			return "[ENQ]";
		case "\x06":
			return "[ACK]";
		case "\x07":
			return "[BEL]";
		case "\x0E":
			return "[SO]";
		case "\x0F":
			return "[SI]";
		case "\x10":
			return "[DLE]";
		case "\x11":
			return "[DC1]";
		case "\x12":
			return "[DC2]";
		case "\x13":
			return "[DC3]";
		case "\x14":
			return "[DC4]";
		case "\x15":
			return "[NAK]";
		case "\x16":
			return "[SYN]";
		case "\x17":
			return "[ETB]";
		case "\x18":
			return "[CAN]";
		case "\x19":
			return "[EM]";
		case "\x1A":
			return "[SUB]";
	}
	return char;
}

const MAX_VIS_STACK_LEN = 24;

function* run(){
	output_el.removeClass("initial").text("").removeClass("exporting");
	set_selected_cell(0, 0);
	let cursor = [0, 0];
	let stack = [];
	let string_mode = false;
	let compose_mode = false;
	let it = 0;
	let horizontal_direction = 1;
	let vertical_direction = 0;
	let output = "";
	let output_shadow_offset = 0; //Number of lines discarded from the output.
	let over_iterations = 0;
	let swap = 0;
	let has_used_swap = false;
	let err = "";
	let handling = "";
	let highspeed_count = 0; //Used in multiple iterations per ms situations

	let heap = [];
	let heap_ptr = 0;
	let heap_mode = false;
	function stack_pop(){
		if(stack.length > 0){
			return stack.pop();
		}else return 0;
	}
	yield;
	main: while(true){
		it++;
		let cell = board[cursor[1]][cursor[0]];
		handling = $("#error-handling").val();
		if(!string_mode && !compose_mode){
			switch (cell) {
				case "0":
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9":
					stack.push(Number(cell));
					break;
				case "+":
					stack.push(Number(stack_pop()) + Number(stack_pop()));
					break;
				case "-":
					stack.push(stack_pop() - stack_pop());
					break;
				case "*":
					stack.push(stack_pop() * stack_pop());
					break;
				case "/":
					let a = stack_pop();
					let b = stack_pop();
					let ans = 0;
					if(a != 0 && b != 0){
						ans = Math.floor(a / b);
					}else{
						if(handling != "ignore"){
							output += err = `\x1b[31;40m(E0: Divide by zero [Solve ${a} / ${b}])\x1b[0m`;
						}
						if(handling == "strict"){
							break main; //The switch statement should not be broken from, the main loop should be broken from
						}
					}
					stack.push(ans);
					break;
				case "%":
					stack.push(stack_pop() % stack_pop());
					break;
				case "!":
					stack.push(stack_pop() == 0 ? 1 : 0);
					break;
				case "`": //Greater than
					if(!heap_mode){
						stack.push(stack_pop() > stack_pop() ? 1 : 0);
					}else{ //Allocate memory
						let len = stack_pop(); //Number of bytes to allocate
						if(len > 0){
							heap.push(...(new Array(len).fill(0)));
							console.log(`Allocated ${len} bytes`);
						}
						heap_mode = false;
					}
					break;
				case ">":
					if(!heap_mode){ //Right
						horizontal_direction = 1;
						vertical_direction = 0;
					}else{ //Move heap pointer to the right
						heap_ptr++;
						heap_mode = false;
					}
					break;
				case "<":
					if(!heap_mode){ //Left
						horizontal_direction = -1;
						vertical_direction = 0;
					}else{ //Move heap pointer to the left
						heap_ptr--;
						heap_mode = false;
					}
					break;
				case "^":
					horizontal_direction = 0;
					vertical_direction = -1;
					break;
				case "v":
					horizontal_direction = 0;
					vertical_direction = 1;
					break;
				case "?": //Random direction
					let d = Math.floor(Math.random() * 4); //0, 1, 2, 3
					if(d == 0){
						horizontal_direction = 1;
						vertical_direction = 0;
					}else if(d == 1){
						horizontal_direction = -1;
						vertical_direction = 0;
					}else if(d == 2){
						horizontal_direction = 0;
						vertical_direction = -1;
					}else{
						horizontal_direction = 0;
						vertical_direction = 1;
					}
					break;
				case "_":
					if(!heap_mode){ //Logic Horizontal
						horizontal_direction = stack_pop() ? -1 : 1;
						vertical_direction = 0;
					}else{ //Set heap pointer to start
						heap_ptr = 0;
						heap_mode = false;
					}
					break;
				case "|":
					if(!heap_mode){ //Logic Vertical
						horizontal_direction = 0;
						vertical_direction = stack_pop() ? -1 : 1;
					}else{ //Set heap pointer to center
						heap_ptr = Math.floor(heap.length / 2);
						heap_mode = false;
					}
					break;
				case "\"":
					string_mode = true;
					break;
				case ":":
					let v = stack_pop();
					if(!heap_mode){ //Clone
						stack.push(v);
						stack.push(v);
					}else{ //Assign heap value
						heap[heap_ptr] = v;
						heap_mode = false;
						console.log(`Assigned ${v} to heap[${heap_ptr}]`);
					}
					break;
				case "\\":
					let i1 = stack_pop();
					let i2 = stack_pop();
					stack.push(i1);
					stack.push(i2);
					break;
				case "$":
					if(!heap_mode){ //Pop-Stack Discard
						stack_pop();
					}else{ //Discard heap value
						heap[heap_ptr] = 0;
					}
					break;
				case ".":
					if(!heap_mode){ //Pop-Stack Output
						output += stack_pop() + " ";
					}else{ //Output heap value
						output += heap[heap_ptr] + " ";
						heap_mode = false;
					}
					break;
				case ",":
					if(!heap_mode){ //Pop-Stack Output ASCII
						output += String.fromCharCode(stack_pop());
					}else{ //Output heap value as ASCII
						output += String.fromCharCode(heap[heap_ptr]);
						heap_mode = false;
					}
					break;
				case "#": //Bridge: Move twice to skip the next cell
					cursor[0] += horizontal_direction;
					cursor[1] += vertical_direction;
					break; //Second move is always done later.
				case "p":
					let y = stack_pop();
					let x = stack_pop();
					let vP = stack_pop();
					if (y > board_height){
						if(handling != "ignore"){
							output += err = `\x1b[31;40m(E3: Position out of bounds [Y: ${y}])\x1b[0m`;
						}
						if(handling == "strict"){
							break main; //The switch statement should not be broken from, the main loop should be broken from
						}
					}else if(x > board_width){
						if(handling != "ignore"){
							output += err = `\x1b[31;40m(E3: Position out of bounds [X: ${x}])\x1b[0m`;
						}
						if(handling == "strict"){
							break main; //The switch statement should not be broken from, the main loop should be broken from
						}
					}else{
						set_selected_cell(x, y);
						set_selected_conts(String.fromCharCode(vP));
					}
					break;
				case "g": //Get cell
					let yG = stack_pop(); //Variables are renamed to avoid re-definition errors
					let xG = stack_pop();
					let cell_read;
					let conts = (cell_read = get_cell_html(xG, yG)).text().charCodeAt(0);
					cell_read.addClass("just_read");
					setTimeout(()=>cell_read.removeClass("just_read"), 1000);
					stack.push(isNaN(conts) ? 0 : conts);
					break;
				case "&":
					stack.push(prompt("Enter a number:"));
					break;
				case "~":
					stack.push(prompt("Enter a character:").charCodeAt(0));
					break;
				case "@": //End
					return;
				case "":
				case " ":
					break;

				//EXTENDED Befunge Commands (non-standard)
				case "'": //Less Than
					stack.push(stack_pop() < stack_pop() ? 1 : 0);
					break;
				case "[": //Shift L
					stack.push(stack.length > 0 ? stack.shift() : 0); //Always be safe so that unknown values are 0s.
					break;
				case "]": //Shift R
					stack.unshift(stack_pop());
					break;
				case "{": //Begin compose mode
					compose_mode = true;
					stack.push(0);
					break; //We don't need an end command for this. it's handled in the compose mode condition.
				case "(": //Assign swap
					has_used_swap = true;
					swap = stack_pop();
					break;
				case ")": //Load swap
					has_used_swap = true;
					stack.push(swap);
					swap = 0;
					break;
				case ";": //Push stack length to stack(Excluding the element added by this command)
					if(!heap_mode){
						stack.push(stack.length);
					}else{ //Push the current allocated heap size to the stack
						stack.push(heap.length);
						heap_mode = false;
					}
					break;
				case "f": //Pop a value from the stack and push the item stack length - n to the stack (if n = 0, pushes the last element(excluding n), 1 is second-last, etc.)
					if(!heap_mode){
						let n = stack_pop();
						stack.push(stack[stack.length - n - 1]);
						break;
					}else{ //Push the value of the heap at the current heap pointer to the stack
						stack.push(heap[heap_ptr]);
						heap_mode = false;
						break;
					}
				case "w": //Outputs stack elements until it hits a null character.
					while(true){
						let v = stack_pop();
						if(v == 0){
							break;
						}else{
							output += String.fromCharCode(v);
						}
					}
					break;
				case "c": //Compose ANSI code from RGB
					let re = stack_pop();
					let gr = stack_pop();
					let bl = stack_pop();
					output += `\x1b[38;2;${re};${gr};${bl}m`;
					break;
				case "e": //Empty output
					output = "";
				case "a": //Ascii input
					stack.push(0, ...prompt("Enter Some Text:").split("").map(char=>char.charCodeAt(0)).reverse());
					break;
				case "=": //Heap Mode
					heap_mode = true;
					break;
				case "𓅱": //BFE (Bird from Egypt)
					output += "𓅱\n";
				default:
					console.log("Unknown character: " + cell);
					if(handling != "ignore"){
						output += err = `\x1b[31;40m(E1: Unknown character "${cell}")\x1b[0m`;
					}
					if(handling == "strict"){
						break main;
					}
			}
		}else if(string_mode){
			if(cell != "\""){
				let value = (cell || " ").charCodeAt(0); //Spacebar clears cells, but in strings we don't want that
				if(!heap_mode){
					stack.push(value);
				}else{
					//Read ASCII into heap
					heap[heap_ptr] = value;
					console.log(`Assigned ${value} to heap[${heap_ptr}]`);
					//Don't disable heap mode, because we want to read the next character
					heap_ptr++; //Move the heap pointer to the next cell
				}
			}else{
				string_mode = false;
				if(heap_mode){
					heap_ptr--; //Leave the heap pointer at the last cell
				}
				heap_mode = false;
			}
		}else if(compose_mode){
			if(cell == "}"){
				compose_mode = false;
			}else{
				//Concat the character to the last element of the stack
				if(!isNaN(Number(cell || "0")))
					stack[stack.length - 1] = stack[stack.length - 1] * 10 + Number(cell || "0");
			}
		}
		cursor[0] += horizontal_direction;
		cursor[1] += vertical_direction;
		//Wrap the cursor
		if(cursor[0] < 0){
			cursor[0] = board_width + cursor[0];
		}
		if(cursor[0] >= board_width){
			cursor[0] = cursor[0] - board_width;
		}
		if(cursor[1] < 0){
			cursor[1] = board_height - cursor[1];
		}
		if(cursor[1] >= board_height){
			cursor[1] = cursor[1] - board_height;
		}
		set_selected_cell(cursor[0], cursor[1]);
		let stackEl = $("#stack");
		stackEl.empty();
		if(stack.length > 32){
			stackEl.append($("<span class='stack-element'>...</span>")); //The bottom of the stack is completely inaccessible, so we don't need to show it
		}
		if(stack.length >= 8192){
			if(handling != "ignore"){
				output += `\x1b[31;40m(E2: Stack Overflow)\x1b[0m`;
			}
			stack = [];
			if(handling == "strict"){
				break;
			}
		}
		//Loop through top 32 elements of stack
		for(let i = 0; i < stack.length; i++){
			if(i + MAX_VIS_STACK_LEN >= stack.length){
				if(stack[i] == undefined)stack[i] = 0;
				if(isNaN(stack[i]))stack[i] = 0;
				if(stack[i] % 1 > 0)stack[i] = Math.trunc(stack[i]);
				let el = `<span class='stack-element'><span class='stack-entry-num'>${i}</span><span class='stack-num'>${pretty_num(stack[i])}</span><span class='stack-char'>${`(${char(stack[i])})`.padEnd(7, " ")}</span></span>`;
				let html = $(el); //Convert to jQuery object	
				html.children(".stack-char").attr("data-char", stack[i]);
				html.children(".stack-char").attr("data-multi", char(stack[i]).length > 1);
				let charEl = html.children(".stack-char")
				charEl.html(charEl.text().replace("(", "(<span class='stack-char-cont'>").replace(")", "</span>)"));
				stackEl.append(html);
			}
		}
		output_el.empty();
		var split = ansi_up.ansi_to_html(output).split("\n");
		var lines = output.split("\n");
		for(var i = 0; i < split.length; i++){ //Loop through bottom 32 lines of output
			if(i + 32 >= split.length){
				output_el.append($(`<span class='output-line'><span class='output-line-no'>${i+output_shadow_offset}</span><span class='output-line-text'>${split[i]}</span></span>`));
			}else{
				output_shadow_offset++; //This is for performance reasons, so we don't loop through every line of output
				lines.splice(i, 1);
				i--;
			}
		}
		//Remove the lines we removed in the loop from the output by joining them together
		output = lines.join("\n");
		//Draw the swap storage
		if(has_used_swap){
			$("#swap-value").text(swap).show();
		}else{
			$("#swap-value").hide();
		}
		//Draw the heap
		if(heap.length > 0){
			let heapEl = $("#heap");
			heapEl.empty();
			for(let i = Math.max(heap_ptr - 16, 0); i < Math.min(heap_ptr + 16, heap.length); i++){ //Loop through the 32 elements around the heap pointer
				let el = `<span class='heap-item'>${heap[i]}</span>`;
				let html = $(el); //Convert to jQuery object
				//If the cell is selected, highlight it
				if(i == heap_ptr){
					html.addClass("selected-heap-item");
				}
				heapEl.append(html);
			}
		}

		if($("#leap").hasClass("selected") && !cell.trim() && over_iterations < 80 && !string_mode){ //Don't yield, just run the next instruction until we hit a non-empty cell
			over_iterations++; //Over iterations is the number of iterations that weren't yielded. It is used to safeguard against infinite loops without yielding.
			continue;
		}else{
			over_iterations = 0;
		}
		if($("#speed-select").val() == "_instanter"){
			highspeed_count++;
			if(highspeed_count >= 100){
				highspeed_count = 0;
				yield it;
			}
		}else{
			yield it;
		}
	}
	if(err && handling == "strict"){
		err = err.replace(/\x1b\[(\d+;)*\d+[a-z]/g, ""); //Remove ANSI escape codes
		console.log(err);
		status.text(`Program exited with error: ${err}`);
		return false;
	}
	if(stepping){ //The step button doesn't have a handler for this, so we implement it here
		current_action = null;
		status.text("Program finished.");
		pause = true;
		update_pause();
	}
}
set_selected_cell(0, 0);
let current_action = null; //The current action being executed
let stepping = false; //Whether we are currently stepping. Used to determine whether sleeping is necessary.
let pause = true;
let current_interval = null;
let current_interval_time = 1000;
function start_at_current_speed(){
	var sel = $("#speed-select").val();
	pause = true; //You have to press play to start
	current_action = run();
	current_action.next(); //Initialize the action
	status.text(`Successfully created iterator at ${sel}ms interval. Use Step, Stop, Pause, and Play to control the program.`);
	current_interval_time = parseInt(sel);
	update_pause();
}
function update_pause(){
	clearInterval(current_interval);
	current_interval = null;
	current_interval_time = parseInt($("#speed-select").val());
	if(!pause){
		current_interval = setInterval(async ()=>{
			if(current_action){
				var r = await current_action.next();
				status.text(`Program has run for ${r.value} cycles.`); //Since it yields it's iteration count, we can use that here.
				if(r.done){
					current_action = null;
					if(r.value != false)status.text("Program finished.");
					pause = true;
					update_pause();
				}
			}
		}, current_interval_time);
	}
	if(pause && current_action)
			status.text("Program paused.");
	if(!current_action){
		//Set all the controls other than speed select and start to disabled
		$("#step").prop("disabled", true);
		$("#stop").prop("disabled", true);
		$("#pause").prop("disabled", true);
	}else{
		$("#step").prop("disabled", false);
		$("#stop").prop("disabled", false);
		$("#pause").prop("disabled", false);
	}
	$("#pause").text(pause ? "Play" : "Pause");
}
update_pause(); //Initialize the pause button and disable buttons
function update_settings(){
	let sel = $("#speed-select").val();
	let auto = $("#auto").hasClass("selected");
	let leap = $("#leap").hasClass("selected");
	let handling = $("#error-handling").val();
	let settings = {
		speed: sel,
		auto,
		leap,
		handling
	};
	localStorage.setItem("settings", JSON.stringify(settings));
}
function load_settings(){
	let settings = localStorage.getItem("settings");
	if(settings){
		settings = JSON.parse(settings);
		$("#speed-select").val(settings.speed);
		$("#auto").toggleClass("selected", settings.auto);
		$("#leap").toggleClass("selected", settings.leap);
		$("#error-handling").val(settings.handling);
	}
}
var has_modified_board = false;
load_settings();
let examples = {
	"Hello World":                         "e:16;118;e:63;n;118;34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;60;44;60;e:61;n;62;e;44:13;57;49;43;94;e:61;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Visible Characters":                  "34;e;34;62;58;44;58;118;e:72;n;e:7;34;e:72;n;e:7;126;e:72;n;e:3;43;e:3;34;e:72;n;e:3;49;e:3;96;e:72;n;e:3;124;e:3;60;e:72;n;e:3;64;e:76;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Queue Visible Characters":            "34;126;34;62;58:2;118;e:73;n;e:6;34;e:73;n;e:3;45;e:2;33;e:73;n;e:3;92;e:2;34;e:73;n;e:3;49;e:2;96;e:73;n;e:3;124;e;33;60;e:73;n;e:3;36;e:76;n;e:3;62;58;44;34;126;34;96;118;e:69;n;e:3;94;e:6;95;64;e:68;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Blank Canvas":                        "e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Random 1-3":                          "118;e:79;n;e:80;n;118;60;e;60;e:76;n;e;49;e:78;n;62;63;50;94;e:76;n;e;51;e:78;n;94;60;e:78;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;99;e:79;n;e:80;",
	"Count to 99":                         "48;62;49;43;58;53;50;42;53;50;42:2;96;118;e:66;n;e;94;e:9;46;58;95;64;e:65;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Endless Counter":                     "48;62;58;46;118;e:75;n;e;94;43;49;60;e:75;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"ANSI Code":                           "118;e;118;43;55;42;43;49;57;50;34;91;57;50;59;52;51;109;72;105;e;116;104;101;114;101;33;34;60;e:51;n;62;e:27;94;e:51;n;e:2;62;44;e:7;44:16;e;64;e:51;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Truth Machine":                       "38;58;33;118;e:76;n;e;64;46;95;58;46;118;e:73;n;e:3;94;33;58;60;e:73;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Single-Stack Hello World":            "118;62;118;62;118;62;118;62;118;62;118;62;118;44;62;e:65;n;34;44;34;44;34;44;34;44;34;44;34;44;34;125;e:66;n;72;34;108;34;111;34;e;34;111;34;108;34;33;48;e:66;n;34;101;34;108;34;44;34;87;34;114;34;100;34;49;e:66;n;44;34;44;34;44;34;44;34;44;34;44;34;44;123;e:66;n;62;94;62;94;62;94;62;94;62;94;62;94;62;94;e:66;n;e:13;62;94;e:65;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Shifting Hello World":                "34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;91;44;123;49;48;125;44;e:34;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Compose Count to 99":                 "48;62;49;43;58;123;57:2;125;96;118;e:69;n;e;94;e:6;46;58;95;64;e:68;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Length-Based Counter":                "62;59;58;118;e:76;n;94;e;46;60;e:76;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"String Printer":                      "34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;e:64;118;n;e:75;64;e:3;48;n;e:75;124;33;58;91;60;n;e:75;62;44;e:2;94;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Looping String Printer":              "62;34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;e:63;118;n;94;e:68;36;44;125;48;49;123;60;e:3;48;n;e:75;124;33;58;91;60;n;e:75;62;44;e:2;94;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:79;99;",
	"Length-Based String Printer":         "34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;e:64;118;n;e:77;118;59;60;n;e:76;118;95;64;e;n;e:76;91;e:3;n;e:76;62;44;e;94;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Looping Length-Based String Printer": "62;34;72;101;108:2;111;44;e;87;111;114;108;100;33;34;e:63;118;n;e:77;118;59;60;n;e:76;118;95;118;e;n;e:76;91;e:3;n;e:76;62;44;e;94;n;e:78;123;e;n;e:78;49;e;n;e:78;48;e;n;e:78;125;e;n;e:78;44;e;n;94;e:77;62;e;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:79;99;",
	"Heap Hello World":                    "123;50;53;54;125;61;96;61;34;33;100;108;114;111;119;e;44;111;108:2;101;72;34;118;60;e:55;n;e:23;61;60;e:55;n;e:23;44;61;e:55;n;e:23;62;94;e:55;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Calculator":                          "C38;e:22;118;62;n;126;e:23;35;n;38;e:24;n;92;e:24;n;93;e:17;118;58;34;45;34;45;95;n;93;e:11;118;58;34;47;34;45;95;e:4;36;e;n;93;e:5;118;58;34;43;34;45;95;e:5;36;e:4;92;e;n;118;58;34;42;34;45;95;e:5;36;e:5;92;e:4;45;e;n;e:6;36;e:5;43;e:5;47;e:4;46;e;n;e:6;42;e:5;46;e:5;46;e:6;n;e:6;46;e:18;n;e:6;118;e:5;118;e:5;118;e:4;118;64;n;e:5;62;94;e:18;n;e:6;95;45;34;62;34;58;94;e:12;n;e:6;36;e:5;95;45;34;60;34;58;94;e:6;n;e:6;39;e:5;36;e:5;95;45;34;37;34;58;94;n;e:6;46;e:5;96;e:5;36;e:6;n;e:5;35;e:6;46;e:5;92;e:6;n;e:2;62;94;e;94;e:12;37;e:6;n;e:2;58;44;e:14;46;e:6;n;e:2;118;95;62;94;118;e:5;118;e:5;118;e:4;62;e;n;e:3;118;e;35;e:6;60;e:12;n;e:5;34;e:19;n;e:5;73;e:19;n;e:5;110;e:19;n;e:5;118;e:19;n;e:5;97;e:19;n;e:5;108;e:19;n;e:5;105;e:19;n;e:5;100;e:19;n;e:25;n;e:5;73;e:19;n;e:5;110;e:19;n;e:5;112;e:19;n;e:5;117;e:19;n;e:5;116;e:19;n;e:4;48;34;e:19;n;e:4;118;60;e:19;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"Better Calculator":                   "C38;e:23;64;n;126;e:5;118;62;e:5;118;62;e:5;118;62;e:3;n;118;58;34;43;34;45;95;118;58;34;45;34;45;95;118;58;34;42;34;45;95;118;e;62;e;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;38;e:6;38;e:4;n;e:6;43;e:6;92;e:6;42;e:4;n;e:6;46;e:6;45;e:6;46;e:4;n;e:13;46;e:11;n;e:25;n;e:6;118;e:6;118;e:6;118;e:3;60;n;e:6;118;62;e:5;118;62;e:5;118;62;e:3;n;118;58;34;47;34;45;95;118;58;34;37;34;45;95;118;58;34;62;34;45;95;e:2;118;e;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;38;e:6;38;e:4;n;e:6;92;e:6;92;e:6;92;e:4;n;e:6;47;e:6;37;e:6;96;e:4;n;e:6;46;e:6;46;e:6;46;e:4;n;e:6;118;e:6;118;e:6;118;e:3;60;n;e:25;n;e:6;118;62;e:5;118;62;e:5;118;e;62;e:2;n;118;58;34;60;34;45;95;118;58;34;50;34;45;95;118;58;34;51;34;45;95;118;e:3;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;58;e:6;58;e:4;n;e:6;96;e:6;42;e:6;58;e:4;n;e:6;46;e:6;46;e:2;62;46;42:2;94;e:4;n;e:6;118;e;118;e:4;118;e:2;118;e:7;60;n;e:25;n;e:25;n;e:25;n;e:6;118;62;46;e:4;118;62;e:5;118;62;e:2;60;n;118;58;34;94;34;45;95;118;58;34;33;34;45;95;118;58;34;61;34;45;95;e;118;e:2;n;e:6;36;e;35;e;62;58;36;94;e:6;36;e:4;n;e:6;58;e;36;e;118;e:2;62;94;e:5;38;e:4;n;e:4;62;38;94;e;36;e:4;58;45;e:5;45;e:4;n;e:4;49;118;62;124;60;35;58;93;94;58;92;e:5;33;e:4;n;e:4;92;e;49;e:7;49;e:5;46;e:4;n;e:4;45;e;92;e:6;118;95;e:5;118;e:3;60;n;e:4;118;60;45;e:5;42;e;36;e:10;n;e:6;118;93;e;58;92;93;60;e;36;e:10;n;e:14;62;e;94;e:8;n;e:14;91;e:10;n;e:14;49;e:10;n;e:14;92;e;42;e:8;n;e:14;45;e;93;e:8;n;e:14;118;58;95;e:8;n;e:16;36;e:8;n;e:16;46;e:8;n;e:4;118;62;e:10;118;e:7;60;n;e:3;62;34;35;e:15;94;e:3;n;e:4;73;e:20;n;e:4;110;119;e:19;n;e:4;118:2;e:18;60;n;e:4;97;e:20;n;e:4;108;e:20;n;e:4;105;e:20;n;e:4;100;e:20;n;e:25;n;e:4;67;e:20;n;e:4;104;e:20;n;e:4;97;e:20;n;e:4;114;e:20;n;e:4;97;e:20;n;e:4;99;e:20;n;e:4;116;e:20;n;e:4;101;e:20;n;e:4;114;e:20;n;e:4;58;e:20;n;e:25;n;e:4;34;e:20;n;e:3;118;60;e:20;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"Looping Better Calculator":           "C118;38;126;62;e:20;118;n;62;e:2;94;e:2;118;62;e:5;118;62;e:5;118;62;e:3;n;118;58;34;43;34;45;95;118;58;34;45;34;45;95;118;58;34;42;34;45;95;118;e;62;e;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;38;e:6;38;e:4;n;e:6;43;e:6;92;e:6;42;e:4;n;e:6;46;e:6;45;e:6;46;e:4;n;e:13;46;e:11;n;e:25;n;e:6;118;e:6;118;e:6;118;e:3;60;n;e:6;118;62;e:5;118;62;e:5;118;62;e:3;n;118;58;34;47;34;45;95;118;58;34;37;34;45;95;118;58;34;62;34;45;95;e:2;118;e;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;38;e:6;38;e:4;n;e:6;92;e:6;92;e:6;92;e:4;n;e:6;47;e:6;37;e:6;96;e:4;n;e:6;46;e:6;46;e:6;46;e:4;n;e:6;118;e:6;118;e:6;118;e:3;60;n;e:25;n;e:6;118;62;e:5;118;62;e:5;118;e;62;e:2;n;118;58;34;60;34;45;95;118;58;34;50;34;45;95;118;58;34;51;34;45;95;118;e:3;n;e:6;36;e:6;36;e:6;36;e:4;n;e:6;38;e:6;58;e:6;58;e:4;n;e:6;96;e:6;42;e:6;58;e:4;n;e:6;46;e:6;46;e:2;62;46;42:2;94;e:4;n;e:6;118;e;118;e:4;118;e:2;118;e:7;60;n;e:25;n;e:25;n;e:25;n;e:6;118;62;46;e:4;118;62;e:5;118;62;e:2;60;n;118;58;34;94;34;45;95;118;58;34;33;34;45;95;118;58;34;61;34;45;95;e;118;e:2;n;e:6;36;e;35;e;62;58;36;94;e:6;36;e:4;n;e:6;58;e;36;e;118;e:2;62;94;e:5;38;e:4;n;e:4;62;38;94;e;36;e:4;58;45;e:5;45;e:4;n;e:4;49;118;62;124;60;35;58;93;94;58;92;e:5;33;e:4;n;e:4;92;e;49;e:7;49;e:5;46;e:4;n;e:4;45;e;92;e:6;118;95;e:5;118;e:3;60;n;e:4;118;60;45;e:5;42;e;36;e:10;n;e:6;118;93;e;58;92;93;60;e;36;e:10;n;e:14;62;e;94;e:8;n;e:14;91;e:10;n;e:14;49;e:10;n;e:14;92;e;42;e:8;n;e:14;45;e;93;e:8;n;e:14;118;58;95;e:8;n;e:16;36;e:8;n;e:16;46;e:8;n;e:4;118;62;e:10;118;e:7;60;n;e:3;62;34;35;e:15;94;e:3;n;e:4;73;e:20;n;e:4;110;119;e:19;n;e:4;118:2;e:18;60;n;e:4;97;e:20;n;e:4;108;e:20;n;e:4;105;e:20;n;e:4;100;e:20;n;e:25;n;e:4;67;e:20;n;e:4;104;e:20;n;e:4;97;e:20;n;e:4;114;e:20;n;e:4;97;e:20;n;e:4;99;e:20;n;e:4;116;e:20;n;e:4;101;e:20;n;e:4;114;e:20;n;e:4;58;e:20;n;e:25;n;e:4;34;e:20;n;e:3;118;60;e:20;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"99 Bottles of Beer":                  "123;57:2;125;58;46;48;62;34;e:2;108:2;97;119;e;101;104;116;e;110;111;e;114;101:2;98;e;102;111;e;115;101;108;116:2;111;98;34;62;58;118;36;e:37;n;e:39;94;44;95;94;62;e:2;58;46;48;118;e:30;n;e:7;48;e:23;118;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;34;60;e:30;n;e:7;46;e:23;62;58;118;e:46;n;e:7;58;e:23;94;44;95;36;57;49;43;44;48;34;110;119;111;100;e;101;110;111;e;101;107;97;84;34;62;58;118;e:22;n;e:7;94;e;60;e:45;94;44;95;118;e:21;n;e:7;62;58;124;e:22;62;58;118;34;e;80;97;115:2;e;105;116;e;97;114;111;117;110;100;34;48;44;43;49;57;36;60;e:21;n;e:7;44;e;64;e:22;94;44;95;118;e:44;n;e:7;43;e:27;36;e:44;n;e:7;49;e:27;57;e:44;n;e:7;57;e:27;49;e:44;n;62;58;118;e:4;36;e:27;43;e:43;62;n;94;44;95;57;49;43;44;94;e:27;44;e:44;n;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;e;111;110;e;116;104;101;e;119;97;108:2;33;34;48;46;58;60;e;49;e:43;94;n;e:35;92;e:44;n;e:35;45;e:44;n;e:33;94;e;60;e:44;n;e:80;n;e:80;n;e:80;n;e:42;62;118;e:36;n;e:42;44;e:37;n;e:42;43;e:37;n;e:42;49;e:37;n;e:42;57;e:37;",
	"Faster 99 Bottles of Beer":           "123;57:2;125;58;46;48;62;e:2;34;108:2;97;119;e;101;104;116;e;110;111;e;114;101:2;98;e;102;111;e;115;101;108;116:2;111;98;34;119;118;e:39;n;e:40;62;e;57;49;43;44;58;46;48;118;e:30;n;e:7;48;e:23;118;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;34;60;e:30;n;e:7;46;e:72;n;e:7;58;e:23;62;119;e:2;57;49;43;44;48;34;110;119;111;100;e;101;110;111;e;101;107;97;84;34;119;e:2;118;e:21;n;e:7;94;e;60;e:70;n;e:7;62;58;124;e:25;118;34;80;97;115:2;e;105;116;e;97;114;111;117;110;100;34;48;44;43;49;57;e;60;e:21;n;e:7;44;e;64;e:70;n;e:7;43;e:27;119;e:44;n;e:7;49;e:27;57;e:44;n;e:7;57;e:27;49;e:44;n;e:35;43;e:44;n;119;e:2;57;49;43;44;94;e:27;44;e:43;62;n;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;e;111;110;e;116;104;101;e;119;97;108:2;33;34;48;46;58;60;e;49;e:43;94;n;e:35;92;e:44;n;e:35;45;e:44;n;e:33;94;e;60;e:44;n;e:80;n;e:80;n;e:80;n;e:42;62;118;e:36;n;e:42;44;e:37;n;e:42;43;e:37;n;e:42;49;e:37;n;e:42;57;e:37;",
	"CAT (Echo)":                          "118;69;110;116;101;114;e;97;110;e;101;109;112;116;121;e;99;104;97;114;97;99;116;101;114;e;119;104;101;110;e;121;111;117;e;97;114;101;e;100;111;110;101;e;105;110;112;117;116:2;105;110;103;e;116;101;120;116;46;e:21;n;118;e:79;n;118;e:3;118;126;60;e:73;n;62:3;126;62;58;124;e:3;64;e:69;n;e:10;36;e:69;n;e:6;62;91;58;33;124;e:69;n;e:6;94;e:2;44;60;e:69;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;n;e:80;",
	"Number guessing game":                "C62;118;62:5;e:18;n;48;118;63:4;62;e:18;n;118:2;49;63;54;55;62;e:18;n;e;118;63:4;62;e:18;n;e;118;63:4;62;e:18;n;e;118;50;63;53;56;62;e:18;n;e;118;63:4;62;e:18;n;e;118;49;63;54;55;62;e:18;n;e;118;63:4;62;e:18;n;e;118;51;63;52;57;62;e:18;n;e;118;63:4;62;e:18;n;e;118;50;63;53;56;62;e:18;n;e;118;63:4;62;e:18;n;e;60:5;62;e:18;n;e:25;n;e:4;62;e;94;e:18;n;e:4;43;e:20;n;e:4;118;92;95;e:18;n;e:4;118;e;62;e;94;e:16;n;e:6;38;e:18;n;e:6;92;e:18;n;e:6;58;e:18;n;e:6;91;e:18;n;e:6;45;e:18;n;e:6;58;e:18;n;e:6;33;e:15;118;62;e;n;e:6;35;e:15;34;119;e;n;e:6;118;e:14;62;89;64;e;n;e:6;95;e:15;111;e:2;n;e:6;48;e:15;117;e:2;n;e:6;96;e:18;n;e:22;87;e:2;n;e:6;33;e:15;105;e:2;n;e:6;35;e:15;110;e:2;n;e:6;118;62;119;e:13;33;e:2;n;e:6;95;48;34;e:13;34;e:2;n;e:4;119;62;94;57;84;e:12;118;60;e:2;n;e:4;34;48;e;49;111;e:16;n;e:4;84;57;e;43;111;e:16;n;e:4;111;49;e:19;n;e:4;111;43;e:2;72;e:16;n;e:8;105;e:16;n;e:4;76;e:3;103;e:16;n;e:4;111;e:3;104;e:16;n;e:4;119;e:3;33;e:16;n;e:4;33;e:3;34;e:16;n;e:4;34;e:2;118;60;e:16;n;e:4;60;94;e:19;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"ROT13 Cipher":                        "C97;e:24;n;e:25;n;118;62;e:2;94;e:2;94;e:17;n;e;58;118;62;60;e:20;n;e;118;95;58;e:21;n;e:2;36;123;e:21;n;e:2;64;54;e:21;n;e:3;53;e:21;n;e:3;125;e:21;n;e:3;92;e:21;n;e:3;45;e:21;n;e:3;48;e:21;n;e:3;96;e:21;n;e:3;35;e:21;n;e:3;118:2;62;e:19;n;e:3;95;e;58;e:19;n;e:3;58;e;123;e:19;n;e:3;123;e;57;e:19;n;e:3;57;e;55;e:19;n;e:3;48;e;125;e:19;n;e:3;125;e;92;e:19;n;e:3;92;e;45;e:19;n;e:3;45;e;48;e:19;n;e:3;48;e;96;e:19;n;e:3;39;e;35;e;44;e:17;n;e:3;35;e;118:2;60;e:17;n;e:3;118;60;95;e:19;n;e:3;95;e;58;e:19;n;e:3;123;e;123;e:19;n;e:3;54;e;49;e:19;n;e:3;53;e;50;e:19;n;e:3;125;e;50;e:19;n;e:3;92;e;125;e:19;n;e:3;45;e;92;e:19;n;e:3;123;e;45;e:19;n;e:3;49;e;48;e:19;n;e:3;51;e;39;e:19;n;e:3;125;e;35;e:19;n;e:3;43;e;118;60;e:18;n;e:3;123;e;95;e:19;n;e:3;50;e;123;e:19;n;e:3;54;e;57;e:19;n;e:3;125;e;55;e:19;n;e:3;92;e;125;e:19;n;e:3;37;e;92;e:19;n;e:3;123;e;45;e:19;n;e:3;54;e:21;n;e:3;53;e;123;e:19;n;e:3;125;e;49;e:19;n;e:3;43;e;51;e:19;n;e:5;125;e:19;n;e:5;43;e:19;n;e:5;123;e:19;n;e:5;50;e:19;n;e:5;54;e:19;n;e:5;125;e:19;n;e:5;92;e:19;n;e:5;37;e:19;n;e:5;123;e:19;n;e:5;57;e:19;n;e:5;55;e:19;n;e:5;125;e:19;n;e:5;43;e:19;n;e:3;118;e;118;e;60;e:17;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"Single-Digit Hex Encoder":            "C38;e:11;34;e:12;n;62;e:11;65;e:12;n;58;e:11;99;e:12;n;57;e:11;99;e:12;n;96;e:11;101;e:12;n;35;e:11;112;e:12;n;118;46;e:9;64;116;e:12;n;95;e:11;115;e:12;n;118;57;49;43;92;45;34;65;34;43;44;60;e:13;n;e:12;49;e:12;n;e:25;n;e:12;72;e:12;n;e:12;101;e:12;n;e:12;120;e:12;n;e:25;n;e:12;100;e:12;n;e:12;105;e:12;n;e:12;103;e:12;n;e:12;105;e:12;n;e:12;116;e:12;n;e:25;n;e:12;40;e:12;n;e:12;97;e:12;n;e:12;110;e:12;n;e:12;121;e:12;n;e:25;n;e:12;110;e:12;n;e:12;117;e:12;n;e:12;109;e:12;n;e:12;98;e:12;n;e:12;101;e:12;n;e:12;114;e:12;n;e:25;n;e:12;48;e:12;n;e:12;45;e:12;n;e:12;49;e:12;n;e:12;53;e:12;n;e:12;41;e:12;n;e:12;46;e:12;n;e:25;n;e:12;80;e:12;n;e:12;114;e:12;n;e:12;105;e:12;n;e:12;110;e:12;n;e:12;116;e:12;n;e:12;115;e:12;n;e:25;n;e:12;110;e:12;n;e:12;117;e:12;n;e:12;109;e:12;n;e:12;98;e:12;n;e:12;101;e:12;n;e:12;114;e:12;n;e:25;n;e:12;97;e:12;n;e:12;115;e:12;n;e:25;n;e:12;104;e:12;n;e:12;101;e:12;n;e:12;120;e:12;n;e:12;46;e:12;n;e:12;34;e:12;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"Single-Digit Hex Decoder":            "C126;e:11;34;e:12;n;58;e:11;65;e:12;n;34;e:11;99;e:12;n;58;e:11;99;e:12;n;34;e:11;101;e:12;n;96;e:11;112;e:12;n;35;e:11;116;e:12;n;118;46;e:9;64;115;e:12;n;95;e:24;n;118;34;65;34;92;45;57;49;43:2;46;60;79;e:12;n;e:12;110;e:12;n;e:12;101;e:12;n;e:25;n;e:12;104;e:12;n;e:12;101;e:12;n;e:12;120;e:12;n;e:25;n;e:12;99;e:12;n;e:12;104;e:12;n;e:12;97;e:12;n;e:12;114;e:12;n;e:12;97;e:12;n;e:12;99;e:12;n;e:12;116;e:12;n;e:12;101;e:12;n;e:12;114;e:12;n;e:25;n;e:12;40;e:12;n;e:12;48;e:12;n;e:12;45;e:12;n;e:12;70;e:12;n;e:12;41;e:12;n;e:12;46;e:12;n;e:25;n;e:12;80;e:12;n;e:12;114;e:12;n;e:12;105;e:12;n;e:12;110;e:12;n;e:12;116;e:12;n;e:12;115;e:12;n;e:25;n;e:12;105;e:12;n;e:12;116;e:12;n;e:25;n;e:12;97;e:12;n;e:12;115;e:12;n;e:25;n;e:12;97;e:12;n;e:25;n;e:12;100;e:12;n;e:12;101;e:12;n;e:12;99;e:12;n;e:12;105;e:12;n;e:12;109;e:12;n;e:12;97;e:12;n;e:12;108;e:12;n;e:12;46;e:12;n;e:25;n;e:12;85;e:12;n;e:12;80;e:12;n;e:12;80;e:12;n;e:12;69;e:12;n;e:12;82;e:12;n;e:12;67;e:12;n;e:12;65;e:12;n;e:12;83;e:12;n;e:12;69;e:12;n;e:25;n;e:12;79;e:12;n;e:12;78;e:12;n;e:12;76;e:12;n;e:12;89;e:12;n;e:12;34;e:12;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
	"FizzBuzz":                            "C48;e:24;n;62;e:15;94;e:8;n;58;e:24;n;53;e:24;n;51;e:24;n;42;e:24;n;92;e:24;n;37;e:9;118;58;46;e:2;62;e:9;n;35;e:4;118;58;51;92;37;95;e:14;n;118;58;53;92;37;95;e:4;118;62;118;62;94;e:10;n;95;e:4;118;62;118;62;94;e:2;34;58;44;e:10;n;118;62;118;62;94;e:2;34;58;44;e:2;70;118;95;e:10;n;e:2;34;58;44;e:2;66;118;95;e:2;105;e;36;e;43;e:8;n;e:2;70;118;95;e:2;117;e;36;e:2;122;e:3;49;e:8;n;e:2;105;e;36;e:2;122;e:4;122;e:3;44;e:8;n;e:2;122;e:4;122;e:3;48;34;e:3;42;e:8;n;e:2;122;e:3;48;34;e:3;118;60;e:3;50;e:8;n;e:2;66;e:3;118;60;e:8;53;e:8;n;e:2;117;e;118;e:4;118;e:4;118:2;60;e:8;n;e:2;122;e:22;n;e:2;122;e:22;n;e;48;34;e:22;n;e;118;60;e:22;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;n;e:25;",
};
var eSelect = $("#example-select");
for(let e in examples){
	eSelect.append($(`<option value="${examples[e]}">${e}</option>`));
}
function contents_at(x, y){
	let h = get_cell_html(x, y);
	return h.text();
}

async function export_board(){ //Board is a run-length encoded string containing controls for newline, empty space, and character codes
	let export_direction = $("#export-mode").val();
	if(export_direction == "text"){
		let str = "";
		body.addClass("exporting");
		output_el.removeClass("initial").addClass("exporting");
		for(let y = 0; y < board.length; y++){
			for(let x = 0; x < board[y].length; x++){
				if(board[y][x]){
					str += board[y][x];
					output_el.html(str);
					set_selected_cell(x, y);
					await sleep(1);
				}else{
					str += " ";
				}
			}
			str += "<br />";
		}
		output_el.html(str);
		body.removeClass("exporting");
		return;
	}
	let str = "";
	body.addClass("exporting");
	if(export_direction == "row"){
		for(let y = 0; y < board_height; y++){
			for(let x = 0; x < board_width; x++){
				str += contents_at(x, y) ? contents_at(x, y).charCodeAt(0) : "e";
				set_selected_cell(x, y);
				//Add a colon and how many of the same cells there are to the right (including this cell). Skip those cells.
				let count = 1;
				for(let k = x + 1; k < board_width; k++){
					if(contents_at(k, y) == contents_at(x, y)){
						count++;
						set_selected_cell(k, y);
					}else{
						break;
					}
				}
				if(count > 1){ //Exclude the count if there's only one cell
					str += ":" + count;
				}
				str += ";";
				output_el.text(str);
				x += count - 1; //Skip the cells we just added
				await sleep(1);
			}
			str += "n;";
		}
	}else{
		str += "C";
		for(let x = 0; x < board_width; x++){
			for(let y = 0; y < board_height; y++){
				str += contents_at(x, y) ? contents_at(x, y).charCodeAt(0) : "e";
				set_selected_cell(x, y);
				let count = 1;
				for(let k = y + 1; k < board_height; k++){
					if(contents_at(x, k) == contents_at(x, y)){
						count++;
						set_selected_cell(x, k);
					}else{
						break;
					}
				}
				if(count > 1){
					str += `:${count}`;
				}
				str += ";";
				output_el.text(str);
				y += count - 1;

				await sleep(1);
			}
			str += "n;";
		}
	}
	body.removeClass("exporting");
}
async function import_board(code=""){
	let board_str;
	if(code){
		board_str = code;
	}else{
		board_str = prompt("Enter the board data you want to import.")
	}
	body.addClass("importing");
	if(board_str){
		let col_mode = false;
		if(board_str.startsWith("C")){
			board_str = board_str.slice(1); //Remove the first character.
			col_mode = true;
		}
		board_str = board_str.split(";");
		let current_x = 0;
		let current_y = 0;
		for(let i = 0; i < board_str.length-1; i++){
			if(board_str[i] == "n"){
				if(!col_mode){
					current_x = 0;
					current_y++;
				}else{
					current_x++;
					current_y = 0;
				}
			}else{
				let data = board_str[i].split(":");
				if(data.length == 1){
					set_selected_cell(current_x, current_y);
					set_selected_conts(data[0] != "e" ? String.fromCharCode(data[0]) : "");
					if(!col_mode)current_x++;
					else current_y++;
				}else{
					let count = parseInt(data[1]);
					for(let j = 0; j < count; j++){
						set_selected_cell(current_x, current_y);
						set_selected_conts(data[0] != "e" ? String.fromCharCode(data[0]) : "");
						if(!col_mode)current_x++;
						else current_y++;
					}
				}
			}
			await sleep(1);
		}
	}
	body.removeClass("importing");
	set_selected_cell(0, 0);
}
function sync_board(){ //Syncs the board array with the board DOM
	for(let y = 0; y < board.length; y++){
		for(let x = 0; x < board[y].length; x++){
			set_selected_cell(x, y);
			set_selected_conts(board[y][x]);
		}
	}
}
async function export_text(){ //Converts board to text and exports it.
	let str = "";
	body.addClass("exporting");
	for(let y = 0; y < board.length; y++){
		for(let x = 0; x < board[y].length; x++){
			if(board[y][x]){
				str += board[y][x];
				output_el.html(str);
				set_selected_cell(x, y);
				await sleep(1);
			}else{
				str += " ";
			}
		}
		str += "<br />";
	}
	output_el.html(str);
	body.removeClass("exporting");
}
function pretty_num(n){
	return n.toLocaleString("en-US");
}
function each_cell(callback){
	for(let x = 0; x < board_width; x++){
		for(let y = 0; y < board_height; y++){
			callback(x, y);
		}
	}
}

async function copy_output(){
	output_el.removeClass("initial").addClass("exporting");
	let originalOutput = output_el.text();
	let output = originalOutput.split("\n").map(ln=>ln.trim()).filter(ln=>!!ln).join("\n");
	let spacing = "";
	navigator.clipboard.writeText(originalOutput);
	for(let idx in originalOutput){
		let char = originalOutput[idx];
		output = output.slice(1);
		spacing += " ";
		output_el.text(spacing + output);

		await sleep(1);
	}
}

const chars = [
	"\0",
	"0",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"+",
	"-",
	"*",
	"/",
	"%",
	"!",
	"`",
	">",
	"<",
	"^",
	"v",
	"?",
	"_",
	"|",
	"\"",
	":",
	"\"",
	"$",
	".",
	",",
	"#",
	"p",
	"g",
	"&",
	"~",
	"@",

	"'",
	"[",
	"]",
	"{",
	"}",
	"(",
	")",
	";",
	"f",
	"w",
	"c",
	"e",
	"a",
	"=",
	"𓅱"
]