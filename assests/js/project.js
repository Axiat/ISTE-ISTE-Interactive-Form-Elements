/*jshint esversion: 6 */



function createElements(text) {
    "use strict";
    const text_array = text;
    const div = document.createElement("div");
    div.className = "question-wrapper";
    const arrayLenth = text_array.length;


    /* Iterate over input and create dictionary */
    const dict = [];
    const used_elements = []; // keps track of elements
    for( let i = 0; i < arrayLenth; i++ ){
        const line = text_array[i];
        console.log(line);
        if (!line.includes("//") && line.length > 0){ // ignore all commented out lines and empty lines
            const parsed_line = line.split("|");
            const element = parsed_line[0].trim();
            const parent = parsed_line[1].trim();
            
            if(used_elements[element] !== true && parent !== element){ // ensures each node only has one parent
                used_elements[element] = true; // mark new element as used

                if( dict[parent] === undefined  ){ // if the parent is not already recorded
                    dict[parent] = [element];
                }
                else{                               // update key if parent is listed
                    const old_vals = dict[parent];
                    dict[parent] = [element].concat(old_vals);
                }
            }

        }
    }

    /* Iterate over keys in dictionary to help build the page */
    for( const key in dict ){
        const line = key + " --> " + dict[key];
        const p = document.createElement("p");
        p.appendChild(  document.createTextNode(line)   );
        div.appendChild(p);
    }

    document.getElementById("content").appendChild(div);
}


function newQuestion(id,question,parent){
    this.id = id;
    this.question = question;
    this.parent = parent;

    this.sayHi = function () {
      console.log("hello bro");
    };

}

var q1 =  new newQuestion(1,"what is that?","a");
q1.sayHi();


/**
 * This function takes in the path of a input file and passes the entire
 * text as an array of strings to the "createElements" function.
 * @param file
 */
function readTextFile(file) {
    "use strict";
    const rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if(rawFile.readyState === 4) {
            if(rawFile.status === 200 || rawFile.status === 0) {
                const allText = rawFile.responseText;
                createElements(allText.split("\n"));
            }
        }
    };
    rawFile.send(null);
}


readTextFile("input.txt");

