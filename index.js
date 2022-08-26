let body = $("#body");
let status = $("#status");
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
	if(e.ctrlKey) return;
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
	}else if(key == "ArrowDown" && !e.shiftKey){
		set_selected_cell(selected_cell_x, selected_cell_y+1);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("down");
		}
	}else if(key == "ArrowDown"){
		activate_pluspad_dir("down", false);
	}else if(key == "ArrowLeft" && !e.shiftKey){
		set_selected_cell(selected_cell_x-1, selected_cell_y);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("left");
		}
	}else if(key == "ArrowLeft"){
		activate_pluspad_dir("left", false);
	}else if(key == "ArrowRight" && !e.shiftKey){
		set_selected_cell(selected_cell_x+1, selected_cell_y);
		if(is_dir_temporary){
			is_dir_temporary = false;
			activate_pluspad_dir("right");
		}
	}else if(key == "ArrowRight"){
		activate_pluspad_dir("right", false);
	}else if(key == " "){
		set_selected_conts("");
		set_selected_cell(selected_cell_x+repos_dir_x, selected_cell_y+repos_dir_y);
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
	$("#output").removeClass("initial").text("");
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
					set_selected_cell(x, y);
					set_selected_conts(String.fromCharCode(vP));
					break;
				case "g": //Get cell
					let yG = stack_pop(); //Variables are renamed to avoid re-definition errors
					let xG = stack_pop();
					let conts = get_cell_html(xG, yG).text().charCodeAt(0);
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
				case "=": //Heap Mode
					heap_mode = true;
					break;
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
			cursor[0] = board_width - 1;
		}
		if(cursor[0] >= board_width){
			cursor[0] = cursor[0] - board_width;
		}
		if(cursor[1] < 0){
			cursor[1] = board_height - 1;
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
		if(stack.length >= 2048){
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
				let el = `<span class='stack-element'><span class='stack-entry-num'>${i}</span><span class='stack-num'>${stack[i]}</span><span class='stack-char'>${`(${char(stack[i])})`.padEnd(7, " ")}</span></span>`;
				let html = $(el); //Convert to jQuery object	
				html.children(".stack-char").attr("data-char", stack[i]);
				html.children(".stack-char").attr("data-multi", char(stack[i]).length > 1);
				let charEl = html.children(".stack-char")
				charEl.html(charEl.text().replace("(", "(<span class='stack-char-cont'>").replace(")", "</span>)"));
				stackEl.append(html);
			}
		}
		let outputEl = $("#output");
		outputEl.empty();
		var split = ansi_up.ansi_to_html(output).split("\n");
		var lines = output.split("\n");
		for(var i = 0; i < split.length; i++){ //Loop through bottom 32 lines of output
			if(i + 32 >= split.length){
				outputEl.append($(`<span class='output-line'><span class='output-line-no'>${i+output_shadow_offset}</span><span class='output-line-text'>${split[i]}</span></span>`));
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
					status.text("Program finished.");
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
	"Calculator":                          "38;126;38;92;93:3;118;e:72;n;e:7;58;e:72;n;e:7;34;e:10;62;58;118;e:59;n;e:7;42;e:10;94;44;95;118;e:58;n;e:7;34;e:12;62;e:15;48;118;e:42;n;e:7;45;e:4;62;e:4;35;94;e;94;35;34;73;110;118;97;108;105;100;e;73;110;112;117;116;34;60;e:42;n;e:6;118;95;36;42;46;118;94;95;36;39;46;e:3;118;e:59;n;e:6;58;e:6;45;e:66;n;e:6;34;e:6;34;e:66;n;e:6;43;e:6;62;e:66;n;e:6;34;e:6;34;e:66;n;e:6;45;e:6;58;e:66;n;e:5;118;95;36;43;46;e;118;e;94;95;36;96;46;e:2;118;60;e:58;n;e:5;58;e:8;45;e:65;n;e:5;34;e:8;34;e:65;n;e:5;47;e:8;60;e:65;n;e:5;34;e:8;34;e:65;n;e:5;45;e:8;58;e:65;n;e:4;118;95;36;92;47;46;e;118;e:2;94;95;36;92;37;46;118;e:59;n;e:4;58;e:10;45;e:64;n;e:4;34;e:10;34;e:64;n;e:4;45;e:10;37;e:64;n;e:4;34;e:10;34;e:64;n;118;e:3;45;36;92;45;46;e:2;118;e:3;58;e:4;62;e:59;n;62;35;e:2;95;e:6;64;e:3;94;e:64;",
	"Better Calculator":                   "38;126;118;e:8;118;e:8;118;e:9;118;e:49;n;e:2;58;e:8;58;e:8;58;e:9;58;e:49;n;e:2;34;e:8;34;e:8;34;e:9;34;e:49;n;e:2;43;e:8;47;e:8;60;e:9;94;e:17;62;e:20;118;e:10;n;e:2;34;e:8;34;e:8;34;e:9;34;e:2;62;49;92;45;118;e:9;118;34;73;110;118;97;108;105;100;e;67;104;97;114;97;99;116;101;114;58;e;34;60;e:10;n;e:2;45;e:8;45;e:8;45;e:9;45;e:2;38;118;e:2;60;e:9;62;35;e;119;118;e:28;n;e;118;95;36;38;43;46;e:2;118:2;95;36;38;92;47;46;118;e;118;95;36;38;96;46;118;e:3;118;95;36;58;94;62;49;92;45;118;e:41;n;e;62;118;e:7;62;118;e:7;62;118;e:8;62;118;e:3;124;e:3;93;e:41;n;e:2;58;e:8;58;e:8;58;e:4;118;e:3;46;58;35;36:2;60;e:45;n;e:2;34;e:8;34;e:8;34;e:9;34;e:3;35;e:3;58;e:41;n;e:2;45;e:8;37;e:8;50;e:9;33;62;118;e;58;e:3;92;e:41;n;e:2;34;e:8;34;e:8;34;e:9;34;58;e:2;93;e:3;93;e:41;n;e:2;45;e:8;45;e:8;45;e:9;45;36;e:2;94;e:2;42;60;e:41;n;e;118;95;36;38;92;45;46;e;118:2;95;36;38;92;37;46;118;e;118;95;36;58;42;46;118;e:3;118;95;94;62;58:2;e;118;e:43;n;e;62;118;e:7;62;118;e:7;62;118;e:8;62;118;e;94;45;92;49;95;36:2;62;91;49;92;45;118;e:35;n;e:2;58;e:8;58;e:8;58;e:9;58;e:13;58;e:35;n;e:2;34;e:8;34;e:8;34;e:3;62;118;e:4;34;e:8;94;e:2;42;93;95;36;46;118;e:32;n;e:2;42;e:8;60;e:8;51;e:3;46;e:5;61;e:49;n;e:2;34;e:8;34;e:8;34;e:3;42;e:5;34;e:49;n;e:2;45;e:8;45;e:8;45;e:3;42;e:5;45;e:49;n;e;118;95;36;38;42;46;e:2;118:2;95;36;38;92;96;46;118;e;118;95;36;58:2;94;e:4;118;95;36;38;45;33;46;118;e:43;n;e;62;118;e:7;62;e:9;118;e:8;62;e:18;94;e:31;n;e:19;62;e:10;118;e:49;n;e:2;62;e:8;118;e:68;n;64;e:8;60;e:7;60;e:7;60;e:3;60;e:6;60;e:10;60;e:3;60;e:28;",
	"99 Bottles of Beer":                  "123;57:2;125;58;46;48;62;34;e:2;108:2;97;119;e;101;104;116;e;110;111;e;114;101:2;98;e;102;111;e;115;101;108;116:2;111;98;34;62;58;118;36;e:37;n;e:39;94;44;95;94;62;e:2;58;46;48;118;e:30;n;e:7;48;e:23;118;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;34;60;e:30;n;e:7;46;e:23;62;58;118;e:46;n;e:7;58;e:23;94;44;95;36;57;49;43;44;48;34;110;119;111;100;e;101;110;111;e;101;107;97;84;34;62;58;118;e:22;n;e:7;94;e;60;e:45;94;44;95;118;e:21;n;e:7;62;58;124;e:22;62;58;118;34;e;80;97;115:2;e;105;116;e;97;114;111;117;110;100;34;48;44;43;49;57;36;60;e:21;n;e:7;44;e;64;e:22;94;44;95;118;e:44;n;e:7;43;e:27;36;e:44;n;e:7;49;e:27;57;e:44;n;e:7;57;e:27;49;e:44;n;62;58;118;e:4;36;e:27;43;e:43;62;n;94;44;95;57;49;43;44;94;e:27;44;e:44;n;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;e;111;110;e;116;104;101;e;119;97;108:2;33;34;48;46;58;60;e;49;e:43;94;n;e:35;92;e:44;n;e:35;45;e:44;n;e:33;94;e;60;e:44;n;e:80;n;e:80;n;e:80;n;e:42;62;118;e:36;n;e:42;44;e:37;n;e:42;43;e:37;n;e:42;49;e:37;n;e:42;57;e:37;",
	"Faster 99 Bottles of Beer":           "123;57:2;125;58;46;48;62;e:2;34;108:2;97;119;e;101;104;116;e;110;111;e;114;101:2;98;e;102;111;e;115;101;108;116:2;111;98;34;119;118;e:39;n;e:40;62;e;57;49;43;44;58;46;48;118;e:30;n;e:7;48;e:23;118;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;34;60;e:30;n;e:7;46;e:72;n;e:7;58;e:23;62;119;e:2;57;49;43;44;48;34;110;119;111;100;e;101;110;111;e;101;107;97;84;34;119;e:2;118;e:21;n;e:7;94;e;60;e:70;n;e:7;62;58;124;e:25;118;34;80;97;115:2;e;105;116;e;97;114;111;117;110;100;34;48;44;43;49;57;e;60;e:21;n;e:7;44;e;64;e:70;n;e:7;43;e:27;119;e:44;n;e:7;49;e:27;57;e:44;n;e:7;57;e:27;49;e:44;n;e:35;43;e:44;n;119;e:2;57;49;43;44;94;e:27;44;e:43;62;n;34;98;111;116:2;108;101;115;e;111;102;e;98;101:2;114;e;111;110;e;116;104;101;e;119;97;108:2;33;34;48;46;58;60;e;49;e:43;94;n;e:35;92;e:44;n;e:35;45;e:44;n;e:33;94;e;60;e:44;n;e:80;n;e:80;n;e:80;n;e:42;62;118;e:36;n;e:42;44;e:37;n;e:42;43;e:37;n;e:42;49;e:37;n;e:42;57;e:37;"
};
var eSelect = $("#example-select");
for(let e in examples){
	eSelect.append($(`<option value="${examples[e]}">${e}</option>`));
}
async function export_board(){ //Board is a run-length encoded string containing controls for newline, empty space, and character codes
	let str = "";
	body.addClass("exporting");
	for(let y = 0; y < board.length; y++){
		for(let x = 0; x < board[y].length; x++){
			str += board[y][x] ? board[y][x].charCodeAt(0) : "e";
			set_selected_cell(x, y);
			//Add a colon and how many of the same cells there are to the right (including this cell). Skip those cells.
			let count = 1;
			for(let k = x + 1; k < board[y].length; k++){
				if(board[y][k] == board[y][x]){
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
			$("#output").text(str);
			x += count - 1; //Skip the cells we just added
			await sleep(1);
		}
		str += "n;";
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
		board_str = board_str.split(";");
		let current_x = 0;
		let current_y = 0;
		for(let i = 0; i < board_str.length-1; i++){
			if(board_str[i] == "n"){
				current_x = 0;
				current_y++;
			}else{
				let data = board_str[i].split(":");
				if(data.length == 1){
					set_selected_cell(current_x, current_y);
					set_selected_conts(data[0] != "e" ? String.fromCharCode(data[0]) : "");
					current_x++;
				}else{
					let count = parseInt(data[1]);
					for(let j = 0; j < count; j++){
						set_selected_cell(current_x, current_y);
						set_selected_conts(data[0] != "e" ? String.fromCharCode(data[0]) : "");
						current_x++;
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
				$("#output").html(str);
				set_selected_cell(x, y);
				await sleep(1);
			}else{
				str += " ";
			}
		}
		str += "<br />";
	}
	$("#output").html(str);
	body.removeClass("exporting");
}