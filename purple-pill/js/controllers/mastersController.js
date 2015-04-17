app.controller("mastersController", function($scope, sharedScope) {
    'use strict';
    $scope.data = sharedScope.data;

    /***** menu control *****/
   
    $scope.uniqueMasterId = 0;

    $scope.deleteMasters = function(){
        // need to make functionality to go through design spaces and instances to remove masters as well
        // and in instances recalculate the metap values
        var thisIndex;
        if (confirm("You are about to remove master(s). This could affect design spaces as well. Ok?")) {
            angular.forEach($scope.data.sequences, function(sequence) {
                var notDeleted = [];
                angular.forEach(sequence.masters, function(master, index) {
                    if (!master.edit){
                        notDeleted.push(master);
                    } else {
                        thisIndex = index;
                        $scope.data.removeMasterFromDesignSpace(master.name);
                        if($scope.data.pill != "blue") {
                            $scope.data.stateful.project.deleteMaster(master.name);
                            // empty cps file to prevent caching issues
                            $scope.data.stateful.project.ruleController.write(false, master.cpsFile, ""); 
                        }
                    }
                });
                sequence.masters = notDeleted;
            }); 
        }
        // after deleting all selected masters, select a new master
        var n = $scope.data.sequences[0].masters.length;
        if (n <= thisIndex) {
            $scope.data.sequences[0].masters[n - 1].edit = true;
        } else {
            $scope.data.sequences[0].masters[thisIndex].edit = true;
        }
        $scope.data.localmenu.masters = false;
    };
    
    $scope.importUfo = function () {
        $scope.data.alert("Loading. Your UFO is coming soon.", true);
        $scope.data.localmenu.masters = false;
    };
        
    $scope.duplicateMasters = function () {
        angular.forEach($scope.data.sequences, function(sequence) {
            angular.forEach(sequence.masters, function(master) {
                if (master.edit) {
                    // deselect this one
                    master.edit = false;
                    $scope.uniqueMasterId++;
                    var masterName = "master" + $scope.uniqueMasterId;
                    var cpsFile = masterName + ".cps";
                    // duplicate cps file
                    var sourceCollection = $scope.data.stateful.controller.getMasterCPS(false, master.name);
                    var cpsString = "" + sourceCollection;
                    // create new cps file and new master
                    $scope.data.stateful.project.ruleController.write(false, cpsFile, cpsString); 
                    $scope.data.stateful.project.createMaster(masterName, cpsFile, "skeleton.base");
                    $scope.data.stateful.project.open(masterName);
                    $scope.data.sequences[0].masters.push({
                        id: $scope.uniqueMasterId,
                        name: masterName,
                        displayName: masterName,
                        cpsFile: cpsFile,
                        ruleIndex: angular.copy(master.ruleIndex),
                        display: false,
                        edit: true,
                        ag: angular.copy(master.ag),
                        glyphs: angular.copy(master.glyphs),
                        parameters: angular.copy(master.parameters)
                    });
                }
            });
        });
        $scope.data.localmenu.masters = false;
    };
   

    /***** selecting *****/

    $scope.mouseDown = false;
    
    $scope.toggleViewSet = function(set, initialDisplay) {
        if (initialDisplay == "true") {
            var newStatus = false;
        } else {
            var newStatus = true;
        }
        angular.forEach($scope.data.sequences, function(sequence) {
            angular.forEach(sequence.masters, function(master) {
                var hit = false;
                angular.forEach(set, function(selection) {
                    if (selection.parentObject == sequence.id && selection.childObject == master.id) {
                        hit = true;
                    }
                });
                if (hit) {
                    master.display = newStatus;
                }
            });
        }); 
    };

    $scope.toggleEdit = function(listItem) {
        if($scope.data.view.viewState == 0) {
            angular.forEach($scope.data.sequences, function(sequence) {
                angular.forEach(sequence.masters, function(master) {
                    if (listItem.parentObject == sequence.id && listItem.childObject == master.id) {
                        master.edit = !master.edit;
                        if (master.edit == false) {
                            $scope.deselectAllGlyphs(master);
                        }
                    }
                });
            });  
            $scope.data.updateSelectionParameters();
        }
    };

    $scope.selectEdit = function(set) {
        if($scope.data.view.viewState == 0) {
            angular.forEach($scope.data.sequences, function(sequence) {
                angular.forEach(sequence.masters, function(master) {
                    var hit = false;
                    angular.forEach(set, function(selection) {
                        if (selection.parentObject == sequence.id && selection.childObject == master.id) {
                            hit = true;
                        }
                    });
                    if (hit) {
                        master.edit = true;
                    } else {
                        master.edit = false;
                        $scope.deselectAllGlyphs(master);
                    }
                });
            });
            $scope.data.updateSelectionParameters();
        }
    };

    $scope.deselectAll = function() {
        if($scope.data.view.viewState == 0) {
            angular.forEach($scope.data.sequences, function(sequence) {
                angular.forEach(sequence.masters, function(master) {
                    master.edit = false;
                    $scope.deselectAllGlyphs(master);
                });
            });
            $scope.data.updateSelectionParameters();
        }
    };
    
    $scope.toggleDisplay = function(master) {
        if($scope.data.view.viewState == 0) {
            master.display = !master.display;
        }
    };
    
    $scope.deselectAllGlyphs = function (master) {
        angular.forEach(master.glyphs, function(glyph) {
            glyph.edit = false;
        });
    };

    /***** Dropping to design space *****/

    $scope.sortableOptionsSequences = {
        helper : 'clone',
        handle : '.sequence-name'
    };

    $scope.sortableOptionsMasters = {
        //cancel : '.no-drag, .drop-area, .diamond, .sequence-name',
        handle : '.list-edit-col',
        helper : 'clone',
        connectWith : '.drop-area, .sequence',
        sort : function(e, ui) {
            if (IsOverDropArea(ui)) {
                $(".drop-area").addClass("drag-over");
            } else {
                $(".drop-area").removeClass("drag-over");
            }
        },
        update : function(e, ui) {
        },
        stop : function(e, ui) {
            // push master to design space when dropped on drop-area
            if (IsOverDropArea(ui)) {
                // check which master is dropped
                var sequenceIndex = ui.item.parent().parent().index();
                var masterIndex = ui.item.index();
                var master = $scope.data.sequences[sequenceIndex].masters[masterIndex];
                // check if master already in this designspace
                if (isInDesignSpace(master.name)) {
                    alert("master already in this Design Space");
                } else {
                    $scope.addMasterToDesignSpace(master);
                    $scope.$apply();
                }
            }
            $(".drop-area").removeClass("drag-over");
        }
    };

    $scope.addMasterToDesignSpace = function(master) {
        var designspace = $scope.data.currentDesignSpace;
        if ($scope.data.currentDesignSpace.type == "x") {
            $scope.data.currentDesignSpace.type = "Control";
        }
        var thisValue = 0;
        if (designspace.axes.length == 0) {
           thisValue = 50;
        }
        if (designspace.axes.length == 1) {
           thisValue = 100 -  designspace.axes[0].value;
        }
        designspace.axes.push({
            masterName : master.name,
            masterdisplayName: master.displayName,
            value : thisValue,
            metapValue : 1
        });
        $scope.data.addAxisToInstance(master, thisValue);
        if (designspace.axes.length == 1) {
           $scope.data.addInstance(); 
        }
        if (designspace.axes.length > 1) {
           $scope.data.metapolate(); 
        }
        $scope.data.checkIfIsLargest();
    };

    function isInDesignSpace(masterName) {
        var x = false;
        for (var i = 0; i < $scope.data.currentDesignSpace.axes.length; i++) {
            if ($scope.data.currentDesignSpace.axes[i].masterName == masterName) {
                x = true;
                break;
            }
        }
        return x;
    }

    function IsOverDropArea(ui) {
        var dropLeft = $(".drop-area").offset().left;
        var dropRight = $(".drop-area").offset().left + $(".drop-area").outerWidth();
        var dropTop = $(".drop-area").offset().top;
        var dropBottom = $(".drop-area").offset().top + $(".drop-area").outerHeight();

        var thisLeft = ui.offset.left;
        var thisRight = ui.offset.left + ui.item.outerWidth();
        var thisTop = ui.offset.top;
        var thisBottom = ui.offset.top + ui.item.outerHeight();

        var marginHor = ui.item.outerWidth() / 2;
        var marginVer = ui.item.outerHeight() / 2;

        if (dropLeft < (thisLeft + marginHor) && dropRight > (thisRight - marginHor) && dropTop < (thisTop + marginVer) && dropBottom > (thisBottom - marginVer)) {
            return true;
        } else {
            return false;
        }
    }

});