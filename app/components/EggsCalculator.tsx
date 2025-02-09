'use client';

import React, { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckedState } from '@radix-ui/react-checkbox';
import { FaPaw } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface EventProgressResult {
    finalRound: number;
    finalStage: number;
    finalPoints: number;
    finalTotalPoints: number; // Changed name to finalTotalPoints
    rewards: {
        hammers: number;
        eggs: number;
        gems: number;
        tickets: number;
    };
}

/**
 * ResultItem - A reusable component to display a label and value pair.
 */
const ResultItem: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
    >
        <p className="text-sm text-slate-600 sm:whitespace-nowrap">{label}</p>
        <p className="font-bold text-blue-600">{value}</p>
    </motion.div>
);

type CalculationMode = 'minEggs' | 'maxPoints'; // Define the type for calculation mode


/**
 * EggCalculator - A component for calculating egg openings and rewards.
 */
const EggCalculator: React.FC = () => {
    const [isEvent, setIsEvent] = useState<boolean>(false);
    const [targetTotalPoints, setTargetTotalPoints] = useState<string>(''); // Target total points (event mode)
    const [availableEggs, setAvailableEggs] = useState<string>(''); // Available eggs (non-event mode)
    const [targetEggs, setTargetEggs] = useState<string>(''); // Target eggs (non-event mode)
    const [currentRound, setCurrentRound] = useState<string>('1');
    const [currentStage, setCurrentStage] = useState<string>('1');
    const [currentRoundPoints, setCurrentRoundPoints] = useState<string>('0');
    const [totalPoints, setTotalPoints] = useState<string>('');
    const [error, setError] = useState<string | null>(null);  // Keep error, but add usage
    const [showResults, setShowResults] = useState(false);
    const [calculationMode, setCalculationMode] = useState<CalculationMode>('minEggs'); // State for calculation mode


    // Game constants (wrapped in useMemo)
    type StageKey = 1 | 2 | 3 | 4 | 5;
    const EGGS_PER_STAGE = useMemo(() => ({ 1: 500, 2: 500, 3: 1000, 4: 1000, 5: 1000 } as Record<StageKey, number>), []);
    const STAGE_REWARDS = useMemo(() => ({
        1: { hammers: 100, eggs: 30, gems: 100 },
        2: { hammers: 100, eggs: 60, gems: 100 },
        3: { hammers: 100, eggs: 90, gems: 100 },
        4: { hammers: 100, eggs: 120, gems: 100 },
        5: { hammers: 100, eggs: 200, gems: 100 },
    } as { [key: number]: { hammers: number; eggs: number; gems: number } }), []);
    const ROUND_REWARDS = useMemo(() => ({ tickets: 2, hammers: 3000, gems: 1000 }), []);

    /** Handles checkbox change. */
    const handleCheckboxChange = (checked: CheckedState) => {
        setIsEvent(checked === true);
        setError(null);
        setShowResults(false);
    };

    /** Generic input change handler */
    const handleInputChange = (setState: React.Dispatch<React.SetStateAction<string>>, e: ChangeEvent<HTMLInputElement>, inputType: string) => {
        const value = e.target.value;
        setState(value);
        validateInput(value, inputType);
        setShowResults(true) // Show results after *any* input
    };

    /** Handles change on total points input */
    const handleTotalPointsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTotalPoints(value);
        validateInput(value, 'totalPoints');
        setShowResults(true);
        if (value) {
            setCurrentRound('');
            setCurrentStage('');
            setCurrentRoundPoints('');
        }
    }

    /** Validates input, showing toast notifications for errors. */
    const validateInput = (value: string, inputType: string) => {
        if (value === '') {
            setError(null);
            return;
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0) {
            const errorMessage = `Invalid input for ${inputType}. Please enter a non-negative number.`;
            toast.error(errorMessage);
            setError(errorMessage); // Set error state
            return;
        }
        if (numValue > 1000000) {
            const errorMessage = `Input for ${inputType} is too large.`;
            toast.error(errorMessage);
            setError(errorMessage); // Set error state
            return;
        }
        setError(null);
    };

    /** Resets all input fields and results. */
    const handleClear = () => {
        setIsEvent(false);
        setTargetTotalPoints('');
        setAvailableEggs('');
        setTargetEggs('');
        setCurrentRound('1');
        setCurrentStage('1');
        setCurrentRoundPoints('0');
        setTotalPoints('')
        setError(null);
        setShowResults(false);
        setCalculationMode('minEggs') //Also reset calculation mode
    };

    const nonEventCalculator = useMemo(() => {
        const numEggs = parseInt(availableEggs);
        if (isNaN(numEggs) || numEggs < 0) return null;

        const batches = Math.floor(numEggs / 30);
        const eggsOpened = batches * 35;
        const eggsRemaining = numEggs - (batches * 30);

        return (
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">Maximum Egg Openings</h3>
                <div className="grid grid-cols-3 gap-4">
                    <ResultItem label="Total Eggs to Open" value={eggsOpened} />
                    <ResultItem label="Remaining Eggs" value={eggsRemaining} />
                    <ResultItem label="Batches (35 Eggs)" value={batches} />
                </div>
            </div>
        );
    }, [availableEggs]);

    const specificEggsCalculator = useMemo(() => {
        const numTargetEggs = parseInt(targetEggs);
        if (isNaN(numTargetEggs) || numTargetEggs < 0) return null;

        const totalBatches = Math.ceil(numTargetEggs / 35);
        const eggsNeeded = totalBatches * 30;
        const extraEggs = (totalBatches * 35) - numTargetEggs;

        return (
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">Specific Number of Eggs</h3>
                <div className="grid grid-cols-3 gap-4">
                    <ResultItem label="Total Batches" value={totalBatches} />
                    <ResultItem label="Total Eggs Needed" value={eggsNeeded} />
                    <ResultItem label="Extra Eggs" value={extraEggs} />
                </div>
            </div>
        );
    }, [targetEggs]);

    const calculateEventProgress = useMemo(() => {
        return (availableEggs?: string, currentRoundPointsParam?: string, totalPointsParam?: string, currentRoundParam?:string, currentStageParam?:string): EventProgressResult | null => {

            let availableEggsNum = parseInt(availableEggs || '0');
            if (isNaN(availableEggsNum) || availableEggsNum < 0) availableEggsNum = 0;
            
            const currentRoundPointsNum = parseInt(currentRoundPointsParam || '0');
            if (isNaN(currentRoundPointsNum) || currentRoundPointsNum < 0) return null;

            const totalPointsNum = parseInt(totalPointsParam || '0');
            if (isNaN(totalPointsNum)) return null;

            let round = parseInt(currentRoundParam || '1');
            let stage = parseInt(currentStageParam || '1');

            const totalRewards = { hammers: 0, eggs: 0, gems: 0, tickets: 0 };
            let isRound4Complete = false;

            // Add rewards from already completed stages and rounds
            for (let r = 1; r < round; r++) {
                if (r <= 4) {
                    totalRewards.hammers += ROUND_REWARDS.hammers;
                    totalRewards.gems += ROUND_REWARDS.gems;
                    totalRewards.tickets += ROUND_REWARDS.tickets;
                    for (let s = 1; s <= 5; s++) {
                        totalRewards.eggs += STAGE_REWARDS[s].eggs;
                        totalRewards.hammers += STAGE_REWARDS[s].hammers;
                        totalRewards.gems += STAGE_REWARDS[s].gems;
                    }
                }
            }

            if (round <= 4) {
                for (let s = 1; s < stage; s++) {
                    const stageRewards = STAGE_REWARDS[s];
                    totalRewards.hammers += stageRewards.hammers;
                    totalRewards.eggs += stageRewards.eggs;
                    totalRewards.gems += stageRewards.gems;
                }
            }

            // Add the already won eggs to the available eggs
            availableEggsNum += totalRewards.eggs;

            let currentRoundPointsLocal = currentRoundPointsNum;
            let finalTotalPoints = totalPointsNum;


            while (availableEggsNum >= 30) {
                availableEggsNum -= 30; // Cost of opening 35 eggs
                let eggsOpened = 35;

                currentRoundPointsLocal += eggsOpened;
                finalTotalPoints += eggsOpened;

                while (currentRoundPointsLocal >= EGGS_PER_STAGE[stage as StageKey] && eggsOpened > 0 && !isRound4Complete) {
                    const pointsToCompleteStage = EGGS_PER_STAGE[stage as StageKey] - (currentRoundPointsLocal - eggsOpened);
                    currentRoundPointsLocal -= EGGS_PER_STAGE[stage as StageKey];
                    eggsOpened -= pointsToCompleteStage;

                    if (round <= 4) {
                        const stageRewards = STAGE_REWARDS[stage];
                        totalRewards.hammers += stageRewards.hammers;
                        totalRewards.eggs += stageRewards.eggs;
                        totalRewards.gems += stageRewards.gems;
                        availableEggsNum += stageRewards.eggs; // Add reward eggs
                    }

                    if (stage === 5) {
                        // Round completion
                        if (round < 4) {
                            totalRewards.tickets += ROUND_REWARDS.tickets;
                            totalRewards.hammers += ROUND_REWARDS.hammers;
                            totalRewards.gems += ROUND_REWARDS.gems;
                            round++;
                            stage = 1;
                        } else if (round === 4) {
                            isRound4Complete = true;
                            currentRoundPointsLocal += eggsOpened;
                            eggsOpened = 0;
                        }
                    } else {
                        stage++;
                    }
                }

                if (isRound4Complete) {
                    currentRoundPointsLocal += eggsOpened;
                }
            }

             // Handle points after round 4 completion
            if (finalTotalPoints >= 16000 || isRound4Complete) {
                round = 4;
                stage = 5;
                currentRoundPointsLocal = Math.min(currentRoundPointsLocal, 4000);
                finalTotalPoints = Math.max(finalTotalPoints, 16000);
            }


            return {
                finalRound: round,
                finalStage: stage,
                finalPoints: currentRoundPointsLocal,
                finalTotalPoints: finalTotalPoints,
                rewards: totalRewards
            };
        };
    }, [EGGS_PER_STAGE, STAGE_REWARDS, ROUND_REWARDS]);

    const finalResult = useMemo(() => {
        if (calculationMode !== 'minEggs' || !targetTotalPoints) return null;

        const targetTotalPointsNum = parseInt(targetTotalPoints);
        if(isNaN(targetTotalPointsNum)) return null;

        let currentTotalPointsNum = parseInt(totalPoints || '0')
        if(isNaN(currentTotalPointsNum)) currentTotalPointsNum = 0;

        // Initial values for simulation
        let availableEggs = 0; // Starting with 0 available eggs
        let currentRoundPointsLocal = parseInt(currentRoundPoints || '0');
        let totalPointsLocal = currentTotalPointsNum;
        let round = parseInt(currentRound || '1');
        let stage = parseInt(currentStage || '1');
        let isRound4Complete = false;


        // Simulate egg openings until target points are reached or exceeded
        while (totalPointsLocal < targetTotalPointsNum) {
            if (availableEggs < 30) {
              availableEggs += 30; // Buy a batch of eggs
            }

            availableEggs -= 30;  // Open 35
            let eggsOpened = 35;
            currentRoundPointsLocal += eggsOpened; // Increase round points
            totalPointsLocal += eggsOpened;

              // Handle stage and round completions
            while(currentRoundPointsLocal >= EGGS_PER_STAGE[stage as StageKey] && eggsOpened > 0 && !isRound4Complete){
                const pointsToCompleteStage = EGGS_PER_STAGE[stage as StageKey] - (currentRoundPointsLocal - eggsOpened);
                currentRoundPointsLocal -= EGGS_PER_STAGE[stage as StageKey];
                eggsOpened -= pointsToCompleteStage;


                 if (round <= 4) {
                  availableEggs += STAGE_REWARDS[stage].eggs
                }
                if (stage === 5) {
                    // Round completion
                    if (round < 4) {
                        round++;
                        stage = 1;
                    } else if (round === 4) {
                        isRound4Complete = true;
                        currentRoundPointsLocal += eggsOpened;
                        eggsOpened = 0; // Stop opening eggs once Round 4 is complete
                    }
                } else {
                    stage++; // Move to the next stage
                }
            }
            if (isRound4Complete) {
                currentRoundPointsLocal += eggsOpened;
            }
        }
        //Handle going past round 4

        if (totalPointsLocal >= 16000 || isRound4Complete) {
            totalPointsLocal = Math.max(totalPointsLocal, 16000);
        }
        return {
            eggsNeeded: availableEggs,
        };
    }, [targetTotalPoints, calculationMode, totalPoints, currentRoundPoints, currentRound, currentStage, EGGS_PER_STAGE, STAGE_REWARDS]);


    // Auto-update effects for total points
    useEffect(() => {
        const totalPointsNum = parseInt(totalPoints || '0');
        if (isNaN(totalPointsNum) || totalPointsNum < 0) {
            setCurrentRound('');
            setCurrentStage('');
            setCurrentRoundPoints('');
            return;
        }

        let autoRound = 1;
        let autoRoundPoints = 0;
        let autoStage = 1;

        if (totalPointsNum < 16000) {
            autoRound = Math.floor(totalPointsNum / 4000) + 1;
            autoRoundPoints = totalPointsNum % 4000;
            if (autoRoundPoints >= 3000) autoStage = 5;
            else if (autoRoundPoints >= 2000) autoStage = 4;
            else if (autoRoundPoints >= 1000) autoStage = 3;
            else if (autoRoundPoints >= 500) autoStage = 2;
        } else {
            autoRound = 4;
            autoStage = 5;
            autoRoundPoints = 4000;
        }

        if (!totalPoints) return;

        setCurrentRound(autoRound.toString());
        setCurrentStage(autoStage.toString());
        setCurrentRoundPoints(autoRoundPoints.toString());
    }, [totalPoints]);

    // Auto-update effect for round, stage, points to total points
    useEffect(() => {
        const roundNum = parseInt(currentRound);
        const stageNum = parseInt(currentStage);
        const roundPointsNum = parseInt(currentRoundPoints);
        if (!totalPoints && !isNaN(roundNum) && !isNaN(stageNum) && !isNaN(roundPointsNum)) {
            const calculatedTotalPoints = Math.min((roundNum - 1) * 4000 + roundPointsNum, 16000);
            setTotalPoints(calculatedTotalPoints.toString());
        }
}, [currentRound, currentStage, currentRoundPoints, totalPoints]);

return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <div className="bg-slate-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen">
                <Card className="w-full max-w-md bg-white shadow-lg rounded-xl">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-xl py-4 flex items-center justify-center">
                        <FaPaw className="mr-2 h-6 w-6" />
                        <CardTitle className="text-2xl font-bold text-center">Pet Growth Event Calculator</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 p-4 sm:p-6">
                        <TooltipProvider>
                            <Alert className="bg-yellow-100 border-yellow-400 text-yellow-700 rounded-lg">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertTitle className="text-sm font-semibold text-center cursor-pointer">
                                            Open 35 eggs (costs 30 eggs) for maximum efficiency!
                                        </AlertTitle>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>This is because the game offers a discount when opening eggs in batches of 35.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </Alert>
                        </TooltipProvider>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="event-check" checked={isEvent} onCheckedChange={handleCheckboxChange} className="text-blue-600" />
                            <Label htmlFor="event-check" className="text-slate-700 font-medium">Pet Growth Event Active</Label>
                        </div>

                        {isEvent ? (
                            <>
                                <div className="space-y-4">
                                    <Select onValueChange={(value) => setCalculationMode(value as CalculationMode)} value={calculationMode}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select Calculation Mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minEggs">Find the Minimum Eggs Required</SelectItem>
                                            <SelectItem value="maxPoints">Find the Maximum Points Possible</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {calculationMode === 'minEggs' && (
                                        <fieldset className='border-2 border-slate-200 rounded-lg p-4 space-y-4'>
                                            <legend className='text-slate-700 font-medium px-2'>Minimum Eggs Required</legend>
                                            <div className="space-y-1">
                                                <Label htmlFor="total-points" className="text-slate-700">Current Total Points</Label>
                                                <Input id="total-points" type="number" value={totalPoints} onChange={handleTotalPointsChange} placeholder="Enter your total points" className="w-full" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="target-points" className="text-slate-700">Target Total Points</Label>
                                                <Input id="target-points" type="number" value={targetTotalPoints} onChange={(e) => handleInputChange(setTargetTotalPoints, e, 'targetTotalPoints')} placeholder="Enter target total points" className="w-full" />
                                            </div>
                                        </fieldset>
                                    )}

                                     {calculationMode === 'maxPoints' && (
                    <fieldset className='border-2 border-slate-200 rounded-lg p-4 space-y-4'>
                      <legend className='text-slate-700 font-medium px-2'>Maximum Points Possible</legend>
                      <div className="space-y-1">
                        <Label htmlFor="available-eggs-event" className="text-slate-700">Total Available Eggs</Label>
                        <Input
                          id="available-eggs-event"
                          type="number"
                          value={availableEggs}
                          onChange={(e) => handleInputChange(setAvailableEggs, e, 'availableEggs')}
                          placeholder="Enter total available eggs"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="total-points" className="text-slate-700">Total Points</Label>
                        <Input id="total-points" type="number" value={totalPoints} onChange={handleTotalPointsChange} placeholder="Enter your total points" className="w-full" />
                      </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label htmlFor='round-select' className="text-slate-700">Round</Label>
                              <Select
                                disabled={!!totalPoints}
                                value={currentRound} onValueChange={(value) => { setCurrentRound(value); setShowResults(true) }}>
                                <SelectTrigger id='round-select' className="w-full">
                                  <SelectValue placeholder='Select Round' />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4].map(round => (
                                    <SelectItem key={round} value={round.toString()}>
                                      Round {round}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label htmlFor='stage-select' className="text-slate-700">Stage</Label>
                              <Select
                                disabled={!!totalPoints}
                                value={currentStage} onValueChange={(value) => { setCurrentStage(value); setShowResults(true) }}>
                                <SelectTrigger id='stage-select' className="w-full">
                                  <SelectValue placeholder='Select Stage' />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1, 2, 3, 4, 5].map(stage => (
                                    <SelectItem key={stage} value={stage.toString()}>
                                      Stage {stage}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="current-points" className="text-slate-700">Round Points</Label>
                                <Input
                                 disabled={!!totalPoints}
                                id="current-points" type="number" value={currentRoundPoints} onChange={(e) => handleInputChange(setCurrentRoundPoints, e, 'currentPoints')} placeholder="Enter points" className="w-full" />
                              </div>
                        </div>

                    </fieldset>
                  )}
                                </div>


                                {showResults && (
                                    <motion.div
                                        className="mt-4 space-y-4"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut", delay: 0.2 }}
                                    >
                                        {/* Display Eggs Needed if targetTotalPoints is set */}
                                      {calculationMode === 'minEggs' && targetTotalPoints && finalResult && (
                                        <>
                                          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                                            <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">Minimum Eggs Required</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                              <ResultItem label="Eggs Needed" value={finalResult.eggsNeeded} />
                                            </div>
                                          </div>
                                        </>
                                      )}


                                        {/* Display Event Progress if availableEggs is set, including if totalPoints is also set */}
                                        {calculationMode === "maxPoints" && availableEggs && (
                                           (() => {
                                            const progress = calculateEventProgress?.(availableEggs, currentRoundPoints, totalPoints, currentRound, currentStage);
                                            return progress ? (
                                               <>
                                                  <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                                                    <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">
                                                      Event Progress
                                                    </h3>
                                                      <div className="grid grid-cols-2 gap-4">
                                                        <ResultItem label="Final Round" value={progress.finalRound} />
                                                        <ResultItem label="Final Stage" value={progress.finalStage} />
                                                        <ResultItem label="Round Points" value={progress.finalPoints} />
                                                        <ResultItem label="Final Total Points" value={progress.finalTotalPoints} />
                                                      </div>
                                                  </div>
                                                  <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                                                   <h3 className="text-lg font-semibold text-slate-700 mb-2 text-center">Total Rewards</h3>
                                                    <div className="grid grid-cols-4 gap-4">
                                                      <ResultItem label="Hammers" value={progress.rewards.hammers} />
                                                      <ResultItem label="Eggs" value={progress.rewards.eggs} />
                                                      <ResultItem label="Gems" value={progress.rewards.gems} />
                                                      <ResultItem label="Tickets" value={progress.rewards.tickets} />
                                                    </div>
                                                  </div>
                                                </>
                                              ) : null;
                                            })()
                                        )}
                                    </motion.div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-1">
                                    <Label htmlFor="available-eggs-non-event" className="text-slate-700">Available Eggs</Label>
                                    <Input id="available-eggs-non-event" type="number" value={availableEggs} onChange={(e) => handleInputChange(setAvailableEggs, e, 'availableEggs')} placeholder="Enter number of eggs you have" className="w-full" />
                                </div>
                                {availableEggs && showResults && nonEventCalculator}
                                <div className="space-y-1">
                                    <Label htmlFor="target-eggs" className="text-slate-700">Eggs to Open</Label>
                                    <Input id="target-eggs" type="number" value={targetEggs} onChange={(e) => handleInputChange(setTargetEggs, e, 'targetEggs')} placeholder="Enter number of eggs you want to open" className="w-full" />
                                </div>
                                {targetEggs && showResults && specificEggsCalculator}
                            </>
                        )}
                         {error && <p className="text-red-500">{error}</p>} {/* Display the error */}
                        <Button variant="outline" onClick={handleClear} className="w-full">Clear</Button>
                    </CardContent>
                </Card>
                {/* Creator Banner */}
                <motion.footer
                    className="mt-8 w-full max-w-md bg-blue-600 text-white py-2 text-center text-sm rounded-b-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }} // Add a slight delay
                >
                    <p>Any advice or suggestion? Find me on Discord: modifiedwheel</p>
                </motion.footer>
            </div>
        </>
    );
};

export default EggCalculator;