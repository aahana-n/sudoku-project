import React, { useState, useEffect } from 'react';
import './sudoku grid.css';
import './header.css';
import './buttons.css'



const generateRandomGrid = (difficulty: string): string[] => {
    const newGrid = Array(81).fill("");
    let fillCount = 40; // Default fill count for easy difficulty

    switch (difficulty) {
        case 'medium':
            fillCount = 30;
            break;
        case 'hard':
            fillCount = 20;
            break;
        default:
            fillCount = 40; // Easy
    }

    const isValidPlacement = (grid: string[], index: number, num: string) => {
        const rowStart = Math.floor(index / 9) * 9;
        const colStart = index % 9;
        const subGridRowStart = Math.floor(rowStart / 27) * 27;
        const subGridColStart = Math.floor(colStart / 3) * 3;

        // Check row
        for (let i = rowStart; i < rowStart + 9; i++) {
            if (grid[i] === num) return false;
        }

        // Check column
        for (let i = colStart; i < 81; i += 9) {
            if (grid[i] === num) return false;
        }

        // Check 3x3 subgrid
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const subGridIndex = subGridRowStart + subGridColStart + i * 9 + j;
                if (grid[subGridIndex] === num) return false;
            }
        }

        return true;
    };

    for (let i = 0; i < fillCount; i++) {
        let placed = false;
        while (!placed) {
            const randomIndex = Math.floor(Math.random() * 81);
            const randomNumber = (Math.floor(Math.random() * 9) + 1).toString();

            if (isValidPlacement(newGrid, randomIndex, randomNumber)) {
                newGrid[randomIndex] = randomNumber;
                placed = true;
            }
        }
    }

    return newGrid;
};

const SudokuGrid: React.FC = () => {
    const [initialGrid, setInitialGrid] = useState<string[]>(generateRandomGrid('easy'));
    const [grid, setGrid] = useState<string[]>([...initialGrid]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [errorIndexes, setErrorIndexes] = useState<number[]>([]);
    const [difficulty, setDifficulty] = useState<string>('easy');
    const [timeLeft, setTimeLeft] = useState<number>(0); // Time in seconds
    const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

    // Determine the timer duration based on difficulty
    const getTimerDuration = (difficultyLevel: string): number => {
        switch (difficultyLevel) {
            case 'easy':
                return 1800; // 1 hour
            case 'medium':
                return 2700; // 2 hours
            case 'hard':
                return 3600; // 3 hours
            default:
                return 0;
        }
    };

    const handleCellClick = (index: number) => {
        if (initialGrid[index] === "") {
            setSelectedIndex(index);
        }
    };

    const handleNumberInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedIndex !== null) {
            const number = event.target.value;
            if (number.match(/^[1-9]$/)) { // Only accept numbers 1-9
                const newGrid = [...grid];
                newGrid[selectedIndex] = number;

                // Validate the grid and set error indexes
                const errors = validateGrid(newGrid, selectedIndex, number);
                setErrorIndexes(errors);

                setGrid(newGrid);
                setSelectedIndex(null); // Deselect after entering a number
            }
        }
    };

    const handleReset = () => {
        const resetGrid = [...initialGrid];
        setGrid(resetGrid);
        setErrorIndexes([]); // Clear error highlights
        setSelectedIndex(null); // Deselect any cell
        resetTimer();
    };

    const handleGenerateNewGrid = (difficultyLevel: string) => {
        const newGeneratedGrid = generateRandomGrid(difficultyLevel);
        setInitialGrid([...newGeneratedGrid]); // Update initialGrid to preserve new random values
        setGrid([...newGeneratedGrid]); // Set grid to the new generated grid
        setErrorIndexes([]); // Clear error highlights
        setSelectedIndex(null); // Deselect any cell
        setDifficulty(difficultyLevel); // Set the difficulty level
        resetTimer();
    };

    const validateGrid = (newGrid: string[], currentIndex: number, currentValue: string) => {
        const errors: number[] = [];

        // Calculate row, column, and 3x3 subgrid indices
        const rowStart = Math.floor(currentIndex / 9) * 9;
        const colStart = currentIndex % 9;
        const subGridRowStart = Math.floor(rowStart / 27) * 27;
        const subGridColStart = Math.floor(colStart / 3) * 3;

        // Check row
        for (let i = rowStart; i < rowStart + 9; i++) {
            if (i !== currentIndex && newGrid[i] === currentValue) {
                errors.push(i);
            }
        }

        // Check column
        for (let i = colStart; i < 81; i += 9) {
            if (i !== currentIndex && newGrid[i] === currentValue) {
                errors.push(i);
            }
        }

        // Check 3x3 subgrid
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const subGridIndex = subGridRowStart + subGridColStart + i * 9 + j;
                if (subGridIndex !== currentIndex && newGrid[subGridIndex] === currentValue) {
                    errors.push(subGridIndex);
                }
            }
        }

        return errors;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (selectedIndex !== null) {
            if (event.key === 'Backspace' || event.key === 'Delete') {
                const newGrid = [...grid];
                newGrid[selectedIndex] = ""; // Clear the selected cell

                // Validate the grid to remove any errors related to this cell
                const errors = validateGrid(newGrid, selectedIndex, "");
                setErrorIndexes(errors);

                setGrid(newGrid);
                setSelectedIndex(null); // Deselect the cell after deleting
            }
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedIndex, grid]);

    // Timer Effect
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (isTimerActive && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0 && isTimerActive) {
            alert('Time is up!');
            setIsTimerActive(false);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isTimerActive, timeLeft]);

    const startTimer = () => {
        if (!isTimerActive) {
            const duration = getTimerDuration(difficulty);
            setTimeLeft(duration);
            setIsTimerActive(true);
        }
    };

    const resetTimer = () => {
        setTimeLeft(0);
        setIsTimerActive(false);
    };

    // Format time in HH:MM:SS
    const formatTime = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="container">
            <h1 className="sudoku-title">Sudoku</h1>
            <div className="difficulty-buttons">
                <button onClick={() => handleGenerateNewGrid('easy')}>Easy</button>
                <button onClick={() => handleGenerateNewGrid('medium')}>Medium</button>
                <button onClick={() => handleGenerateNewGrid('hard')}>Hard</button>
            </div>
            <div className="timer">
                {isTimerActive ? (
                    <span>Time Left: {formatTime(timeLeft)}</span>
                ) : (
                    <span>Time Left: --:--:--</span>
                )}
            </div>
            <button
                onClick={startTimer}
                disabled={isTimerActive || timeLeft > 0}
                className="start-timer-button"
            >
                Start Timer
            </button>
            <div className="sudoku-grid">
                {grid.map((value, index) => (
                    <input
                        key={index}
                        type="text"
                        maxLength={1}
                        value={value}
                        onClick={() => handleCellClick(index)}
                        onChange={handleNumberInput}
                        className={`cell ${initialGrid[index] !== "" ? 'initial' : 'editable'} ${errorIndexes.includes(index) ? 'error' : ''}`}
                        readOnly={initialGrid[index] !== ""}
                    />
                ))}
            </div>
            <div className="buttons">
                <button onClick={handleReset}>Reset</button>
                <button onClick={() => alert('Submit button clicked!')}>Submit</button>
                <button onClick={() => handleGenerateNewGrid(difficulty)}>Generate New Grid</button>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <div>
            <SudokuGrid />
        </div>
    );
};

export default App;
