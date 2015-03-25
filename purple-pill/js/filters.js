app.filter('mastersInEditFilter', function() {
    return function(sequences) {
        var filtered;
        angular.forEach(sequences, function(sequence) {
            angular.forEach(sequence.masters, function(master) {
                if (master.edit[0]) {
                    filtered = master.parameters;
                }
            });
        });
        return filtered;
    };
});

app.filter('glyphsInEditFilter', function() {
    return function(sequences, theParameters, theOperators) {
        var selectedGlyphs = [];
        // check which glyphs are in edit
        angular.forEach(sequences, function(sequence) {
            angular.forEach(sequence.masters, function(master) {
                if (master.edit[0]) {
                    angular.forEach(master.glyphs, function(glyph) {
                        if (glyph.edit) {
                            selectedGlyphs.push({
                                parameters: glyph.parameters,
                                glyph: glyph,
                                master: master,
                                sequence: sequence
                            });
                        }
                    });
                }
            });
        });      
        
        // compare the standard parameters and operators (the_) with parameters in selected glyphs 
        var parameterArray = [];
        angular.forEach(theParameters, function(theParameter) {
            var theOperations = [];
            var hasThisParameter = false;
            angular.forEach(theOperators, function(theOperator) {
                var hasThisOperator = false;
                var lowest = null;
                var highest = null;
                // look inside glyphs
                angular.forEach(selectedGlyphs, function(glyph) {
                    angular.forEach(glyph.parameters, function(glyphParameter) {
                        if(glyphParameter.name == theParameter) {
                            hasThisParameter = true;
                            angular.forEach(glyphParameter.operations, function(operation) {
                                if (operation.operator == theOperator) {
                                    hasThisOperator = true;
                                    if (operation.value < lowest || lowest == null) {
                                        lowest = operation.value;
                                    }
                                    if (operation.value > highest || highest == null) {
                                        highest = operation.value;
                                    }
                                }
                            });    
                        }
                    });
                });
                var range = true;
                if (lowest == highest) {
                    range = false;
                }
                if (hasThisOperator) {
                    theOperations.push({
                        operator: theOperator,
                        range: range,
                        low: lowest,
                        high: highest 
                    });
                }
            });   
            if (hasThisParameter) {
                parameterArray.push({
                    name: theParameter,
                    operations: theOperations
                });
            }
        });
        return parameterArray;
    };
});

app.filter('rangeFilter', function() {
    return function(specimen, filter) {
        var filtered = [];
        for (var i = 0; i < specimen.length; i++) {
            var thisGlyph = specimen[i];
            if (filter.length == 0) {
                filtered.push(thisGlyph);
            } else {
                if (filter.indexOf(thisGlyph.value) > -1) {
                    filtered.push(thisGlyph);
                }
            }
        }
        return filtered;
    };
});

app.filter('specimenFilter', function() {
    return function(specimen, options, sequences) {
        if (specimen.name != "glyph range") {
            function stringToGlyphs(string, unique) {
                var glyphs = [];
                for (var i = 0; i < string.length; i++) {
                    // temporary to lowercase because Project Zero has no lowercases yet
                    var glyph = string[i].toLowerCase();
                    // detecting linebreak or paragraph
                    if (glyph == "*" && (string[i + 1] == "n" || string[i + 1] == "p")) {
                        glyph = "*" + string[i + 1];
                        i++;
                    } else if (glyph == "<") {
                        // detecting foreign glyph
                        glyph = "";
                        var foundEnd = false;
                        for (var q = 1; q < 10; q++) {
                            if (!foundEnd) {
                                if (string[i + q] != ">") {
                                    glyph += string[i + q];
                                } else {
                                    var foundEnd = true;
                                }
                            }
                        }
                        if (!foundEnd) {
                            // just a normal "<"
                            glyph = "<";
                        } else {
                            i = i + glyph.length + 1;
                        }
                    }
                    if (unique) {
                        // unique is set for the filter
                        if (glyphs.indexOf(glyph) < 0 || glyph == "*n" || glyph == "*p") {
                            glyphs.push(glyph);
                        }
                    } else {
                        glyphs.push(glyph);
                    }
                }
                return glyphs;
            }

            var string = specimen.text;
            var filter = stringToGlyphs(options.filter, true);
            var newText = "";
            var newGlyphText = "";

            // setting the numer of characters needed to match the search box
            var strict = options.strict;
            var required = strict;
            if (strict == 2 && filter.length == 1) {
                required = 1;
            }

            // if nothing in filter, then we use the string 1:1
            if (filter.length == 0) {
                newText = string;
            } else {
                if (strict == 3) {
                    // if strict is 3, we use the filter 1:1
                    newGlyphText = filter;
                } else {
                    var text = string.split(" ");
                    text.forEach(function(word) {
                        var wordInGlyps = stringToGlyphs(word);
                        var hits = 0;
                        for (var i = 0; i < wordInGlyps.length; i++) {
                            if (filter.indexOf(wordInGlyps[i]) > -1) {
                                hits++;
                            }
                            if (hits >= required) {
                                newText += word + " ";
                                break;
                            }
                        }
                    });
                }
            }

            /***** create a masterarray with masters display true *****/
            var masterArray = [];
            var nrOfFonts = 0;
            for (var j = 0; j < sequences.length; j++) {
                for (var k = 0; k < sequences[j].masters.length; k++) {
                    var thisFont = sequences[j].masters[k];
                    if (thisFont.display == true && thisFont.type == "redpill") {
                        nrOfFonts++;
                        var foundFont = {
                            "sequenceId" : j,
                            "masterId" : k,
                            "family" : thisFont.fontFamily,
                            "weight" : thisFont.weight,
                            "name" : thisFont.name
                        };
                        masterArray.push(foundFont);
                    }
                }
            }

            /***** building the filterd string, add a glyphid for the track by at the ng-repeat *****/
            if (newGlyphText == "") {
                // if strict 3, then newflyphtext is already build
                newGlyphText = stringToGlyphs(newText);
            }
            var filtered = [];
            var glyphId = 0;

            for (var q = 0; q < masterArray.length; q++) {
                // repeating for the number of master with display true. every glyph of this loop starts with a new master (masterId)
                var masterId = q;
                for (var i = 0; i < newGlyphText.length; i++) {
                    var glyph = newGlyphText[i];
                    var master = masterArray[masterId];
                    filtered.push({
                        master : {
                            sequenceId : master.sequenceId,
                            masterId : master.masterId,
                            name : master.name
                        },
                        glyphName : glyph,
                        glyphId : master.name + "_" + glyph + "_" + glyphId
                    });
                    
                    glyphId++;
                    if ((options.selectedFontby == "glyph") || (options.selectedFontby == "word" && glyph == " ") || (options.selectedFontby == "paragraph" && glyph == "*p")) {
                        masterId++;
                    }
                    if (masterId == nrOfFonts) {
                        masterId = 0;
                    }
                }
                // paragraph break after each loop
                filtered.push({
                    master : {
                        sequenceId : master.sequenceId,
                        masterId : master.masterId,
                        name : master.name
                    },
                    glyphName : "*n",
                    glyphId : master.name + "_*n_" + glyphId
                });
            }
            // glyph combination matrix
            if (strict == 3 && filter.length > 1) {
                var filteredMatrix = [];
                var fMCounter = 0;
                for (var i = 0; i < filtered.length; i++){
                    for (var j = 0; j < filtered.length; j++){
                        filteredMatrix.push({
                            master: filtered[i].master,
                            glyphName: filtered[i].glyphName,
                            glyphId: filtered[i].glyphName + "_" + fMCounter
                        });  
                        fMCounter++;
                        filteredMatrix.push({
                            master: filtered[j].master,
                            glyphName: filtered[j].glyphName,
                            glyphId: filtered[j].glyphName + "_" + fMCounter
                        });  
                        fMCounter++;
                    }
                }
                return filteredMatrix;
            }
            else {
                return filtered;
            }
        }
    };
});