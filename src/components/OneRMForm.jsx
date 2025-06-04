import React, { useState } from 'react';
import Switch from '@mui/material/Switch';
import { FaPencil, FaCalendar, FaCalendarCheck, FaDumbbell, FaHandBackFist, FaTrash, FaCircleCheck, FaCircleMinus } from "react-icons/fa6";

export default function OneRMTracker() {
  
  const defaultWeek = { name: null, weight: '', reps: '', sets: '', suggestedWeight: null, suggestedReps: null, editName: true, check: false };
  
  const [weeks, setWeeks] = useState([
    defaultWeek
  ]);

  const [useBarbell, setUseBarbell] = useState(false);
  const [editPlate, setEditPlate] = useState(false);
  const [barWeight, setBarWeight] = useState(15);
  const [plates, setPlates] = useState("1,2,3,4,5,10,20");
  const [useVolume, setUseVolume] = useState(false);

  const handleSwitchChange = (event) => {
    setUseVolume(event.target.checked);
    weeks.forEach((week, index) => {
      const updatedWeeks = [...weeks];
      const lastWeek = updatedWeeks[index - 1];
      if (!lastWeek || !lastWeek.weight || !lastWeek.reps) {
        return;
      }
      const ref = event.target.checked ? calculateVolume(parseFloat(lastWeek.weight), parseInt(lastWeek.reps), parseInt(lastWeek.sets)) : calculate1RM(parseFloat(lastWeek.weight), parseInt(lastWeek.reps));
      if (isNaN(ref)) {
        return;
      }
      if (index === 0) {
        updatedWeeks[index].suggestedWeight = null;
        updatedWeeks[index].suggestedReps = null;
      }
      else if (event.target.checked) {
        if (!isNaN(parseInt(week.weight))){
          updatedWeeks[index].suggestedReps = calculateFromVolume(ref, parseInt(week.weight), 'weight');
        }
        else if (!isNaN(parseFloat(week.reps))){
          updatedWeeks[index].suggestedWeight = calculateFromVolume(ref, parseInt(week.reps), 'reps');
        }
        else {
          updatedWeeks[index].suggestedWeight = calculateFromVolume(ref+1, parseInt(lastWeek.reps), 'reps');
          updatedWeeks[index].suggestedReps = calculateFromVolume(ref+1, updatedWeeks[index].suggestedWeight, 'weight');
        }
      }
      else {
        if (!isNaN(parseFloat(week.reps))) {
          updatedWeeks[index].suggestedWeight = calculateFrom1RM(ref, parseInt(week.reps), 'reps');
        }
        else if (!isNaN(parseInt(week.weight))) {
          updatedWeeks[index].suggestedReps = calculateFrom1RM(ref, parseInt(week.weight), 'weight');
        }else {
          updatedWeeks[index].suggestedWeight = calculateFrom1RM(ref+1, parseInt(lastWeek.reps), 'reps');
          updatedWeeks[index].suggestedReps = calculateFrom1RM(ref+1, updatedWeeks[index].suggestedWeight, 'weight');

        }
      }
      setWeeks(updatedWeeks);
    });
  };

  const addPlates = (newPlates) => {
    if(isNaN(newPlates) || newPlates.trim() === '') {
      return;
    }
    const currentPlates = plates.split(',').map(p => parseFloat(p.replace(',', '.')));
    const newPlatesList = newPlates.split(',').map(p => parseFloat(p.replace(',', '.')));
    const combinedPlates = [...new Set([...currentPlates, ...newPlatesList])].sort((a, b) => a - b);
    setPlates(combinedPlates.join(','));
    document.getElementById("add-plate").value = ''; // Clear input after adding
    setEditPlate(false); // Optionally close the edit mode after adding
  };
  
  const removePlate = (index) => {
    const plateList = plates.split(',').map(p => parseFloat(p.replace(',', '.')));
    if (index < 0 || index >= plateList.length) {
      return;
    }
    const updatedPlates = plateList.filter((_, i) => i !== index);
    setPlates(updatedPlates.join(','));
    setEditPlate(false); // Optionally close the edit mode after adding
  };

  const calculate1RM = (weight, reps) => {
    return weight * (1 + reps / 30);
  };

  const calculateVolume = (weight, reps, sets) => {
    return weight * reps * (sets || 1);
  };

  const updateEditName = (index, editName) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[index].editName = !editName;
    setWeeks(updatedWeeks);
  };

  const updateCheck = (index, check) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[index].check = !check;
    if(updatedWeeks[index].suggestedWeight && !updatedWeeks[index].weight) {
      updatedWeeks[index].weight = updatedWeeks[index].suggestedWeight;
    }
    if(updatedWeeks[index].suggestedReps && !updatedWeeks[index].reps) {
      updatedWeeks[index].reps = updatedWeeks[index].suggestedReps;
    }
    setWeeks(updatedWeeks);
  };

  const editName = (index, name) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[index].name = name;
    setWeeks(updatedWeeks);
  };

  const calculateFrom1RM = (target1RM, value, type) => {
    if (type === 'reps') {
      return Math.ceil(target1RM / (1 + value / 30));
    } else {
      return Math.ceil(((target1RM / value) - 1) * 30);
    }
  };

  const calculateFromVolume = (targetVolume, value, type) => {
    return Math.ceil(targetVolume / value)
  };

  const calculatePlates = (totalWeight) => {
    if (isNaN(totalWeight)) {
      return;
    }
    const bar = useBarbell ? barWeight : 0;
    let weightPerSide = (totalWeight - bar) / 2;
    const plateList = plates.split(',').map(p => parseFloat(p.replace(',', '.'))).sort((a, b) => b - a);
    const result = [];
    let originalWeight = weightPerSide;

    for (let plate of plateList) {
      let count = 0;
      while (weightPerSide >= plate) {
        weightPerSide -= plate;
        count++;
      }
      if (count > 0) {
        result.push(`${count * 2}x ${plate}kg`);
      }
    }

    const mismatch = weightPerSide > 0.001;

    return { text: result.join(', '), mismatch };
  };

  const handleAddWeek = () => {
    updateCheck(weeks.length - 1, true);
    const lastWeek = weeks[weeks.length - 1];
    if (!lastWeek) {
      setWeeks([...weeks, defaultWeek]);
      return
    }
    let suggestedWeight = null;
    let suggestedReps = null;

    const weight = parseFloat(lastWeek.weight);
    const reps = parseInt(lastWeek.reps);
    const sets = parseInt(lastWeek.sets);

    if (!isNaN(weight) && !isNaN(reps)) {
      let reference = 0;
      if (useVolume) {
        reference = calculateVolume(weight, reps, sets);
      } else {
        reference = calculate1RM(weight, reps);
      }
      suggestedWeight = useVolume ? calculateFromVolume(reference, reps, 'reps') : calculateFrom1RM(reference, reps, 'reps');
      if(useBarbell) {
        let suggestionCheck = calculatePlates(suggestedWeight);
        while (suggestionCheck.mismatch) {
          suggestionCheck = calculatePlates(++suggestedWeight);
        }
      }
      if (useVolume) {
        suggestedReps = calculateFromVolume(reference + 1, suggestedWeight, 'weight');
      } else {
        suggestedReps = calculateFrom1RM(reference + 1, suggestedWeight, 'weight');
      }
    }

    setWeeks([...weeks, { name: null, weight: '', reps: '', sets: lastWeek.sets, suggestedWeight, suggestedReps, editName: true, check: false }]);
  };

  const handleRemoveWeek = (index) => {
    setWeeks((oldWeeks) => oldWeeks.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    value = value === '' ? null : value;
    const updatedWeeks = [...weeks];
    updatedWeeks[index][field] = value;

    const prevWeek = weeks[index - 1];
    if (index > 0 && prevWeek && prevWeek.weight && prevWeek.reps) {
      let ref = 0;
      if (useVolume) {
        ref = calculateVolume(parseFloat(prevWeek.weight), parseInt(prevWeek.reps), parseInt(prevWeek.sets)) + 1;
      } else {
        ref = calculate1RM(parseFloat(prevWeek.weight), parseInt(prevWeek.reps)) + 0.1;
      }

      if (field === 'reps') {
        let weightSuggestion = 0;
        if (useVolume) {
          weightSuggestion = calculateFromVolume(ref, parseInt(value ?? prevWeek.reps), 'reps');
        } else {
          weightSuggestion = calculateFrom1RM(ref, parseInt(value ?? prevWeek.reps), 'reps');
        }
        let suggestionCheck = calculatePlates(weightSuggestion);
        while (useBarbell && suggestionCheck.mismatch) {
          suggestionCheck = calculatePlates(++weightSuggestion);
        }
        updatedWeeks[index].suggestedWeight = (useBarbell && suggestionCheck.mismatch) ? null : weightSuggestion;
      } else if (field === 'weight') {
        if (useVolume) {
          updatedWeeks[index].suggestedReps = calculateFromVolume(ref, parseFloat(value ?? prevWeek.weight), 'weight');
        } else {
          updatedWeeks[index].suggestedReps = calculateFrom1RM(ref, parseFloat(value ?? prevWeek.weight), 'weight');
        }
      }
    }

    setWeeks(updatedWeeks);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-xl font-bold text-center">Calculadora de Progressão</h1>
      <div className="space-y-2 border p-4 rounded-xl bg-gray-800">
        <label className="switch flex items-center space-x-2">
          <FaHandBackFist />
          <span>Priorizar Força</span>
          <Switch
            checked={useVolume}
            onChange={(e) => handleSwitchChange(e)}
          />
          <span>Priorizar volume</span>
          <FaDumbbell />
        </label>
      </div>

      <div className="space-y-2 border p-4 rounded-xl bg-gray-800">
        <label className="flex items-center space-x-2">
          <button
            checked={useBarbell}
            onClick={() => setUseBarbell(!useBarbell)}
          >
            {!useBarbell ? (
              <>
                <FaCircleCheck className="text-white-500" />
              </>
            ) : (
              <>
                <FaCircleCheck className="text-green-500" />
              </>
            )}
          </button>
          <span>Usar barra</span>
          {useBarbell && (
            <FaDumbbell />
          )}
        </label>

        {useBarbell && (
          <>
            <div>
              <label className="block text-sm">Peso da barra (kg):</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2 border rounded bg-gray-700 text-white"
                value={barWeight}
                onChange={(e) => setBarWeight(parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Anilhas disponíveis:</label>
              <div className='flex gap-2 mb-2' style={{ width: '100%', overflowY: 'hidden' }}>
                {plates.split(",").map((plate, index) => {
                  return (
                    <>
                    <div className='flex align-items-start' key={index}>
                      <label
                      className='bg-gray-900'
                        style={{
                          // background: "darkblue",
                          border: "1px solid white",
                          borderRadius: "100%",
                          width: '40px',
                          height: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>{plate}</label>
                        { editPlate && (
                          <FaCircleMinus className='cursor-pointer text-red-500' onClick={() => removePlate(index)}/>
                        )}
                      </div>
                    </>
                  )
                })}
                <div className='flex align-items-start'>
                <label
                  onClick={() => { setEditPlate(!editPlate) }}
                  className='cursor-pointer bg-gray-900'
                  style={{
                    // background: "darkblue",
                    border: "1px solid white",
                    borderRadius: "100%",
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>{!editPlate ? <FaPencil className='text-white-500'/> : <FaCircleCheck className='text-green-500'/> }</label >
                </div>
              </div>
              {editPlate && (
                <>
                  <label className="block text-sm m">Adicionar valor da placa:</label>
                  <div className='flex gap-2'>
                    <input
                      id='add-plate'
                      type="text"
                      className="w-full p-2 border rounded bg-gray-700 text-white"
                      placeholder={0}
                      // onChange={(e) => addPlates(e.target.value)}
                    />
                    <button style={{width: '50%'}} onClick={() => addPlates(document.getElementById("add-plate").value)}>
                      <FaCircleCheck className="text-green-500 m" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {
        weeks.map((week, index) => {
          const plateInfo = useBarbell && week.weight ? calculatePlates(parseFloat(week.weight)) : null;
          const suggestedPlateInfo = useBarbell && week.suggestedWeight ? calculatePlates(parseFloat(week.suggestedWeight)) : null;

          return (
            <div key={index} className="border p-4 rounded-xl shadow-sm bg-gray-800 space-y-4">
              <div className='flex justify-content-between' style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="flex gap-2" style={{ alignItems: 'center' }}>
                  <button
                    onClick={() => { updateCheck(index, week.check) }}
                  >
                    {(week.check || (week.weight && week.reps)) ? (
                      <> <FaCalendarCheck className="text-green-500" /> </> ) : (
                      <> <FaCalendar className="text-gray-500" /> </>
                    )}
                  </button>
                  {!week.editName ? (
                    <>
                      <h2 className="font-semibold">{week.name ? week.name : "Semana " + (index + 1)}</h2>
                    </>) :
                    (
                      <>
                        <input
                          type="text" className="p-1 border rounded bg-gray-700 text-white"
                          value={week.name || ''} autoFocus
                          onChange={(e) => editName(index, e.target.value)}
                          onBlur={() => updateEditName(index, week.editName)}
                          onKeyUp={(e => { e.key === 'Enter' && updateEditName(index, week.editName) })}
                          placeholder={"Semana " + (index + 1)}
                        />
                      </>
                    )}
                  <button
                    onClick={() => { updateEditName(index, week.editName) }}
                    className="text-white-500 hover:text-blue-900 "
                  >
                    <FaPencil />
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveWeek(index)}
                  className="text-white-500 hover:text-red-500"
                >
                  <FaTrash />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={0}
                    className="w-full p-2 border rounded bg-gray-700 text-white"
                    value={week.weight}
                    placeholder={week.suggestedWeight && !week.weight ? `Sugerido: ${week.suggestedWeight} kg` : ''}
                    onChange={(e) => handleChange(index, 'weight', e.target.value)}
                  />
                  {plateInfo && week.weight && (
                    <>
                      <p className="text-sm text-gray-300 mt-1">Anilhas: {plateInfo.text}</p>
                      {plateInfo.mismatch && (
                        <p className="text-sm text-red-500">Peso inválido com as anilhas e barra disponíveis.</p>
                      )}
                    </>
                  )}
                  {suggestedPlateInfo && week.suggestedWeight && suggestedPlateInfo.mismatch && !week.weight && (
                    <p className="text-sm text-red-500 mt-1">Peso sugerido incompatível com as anilhas e barra disponíveis.</p>
                  )}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Repetições</label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded bg-gray-700 text-white"
                    value={week.reps}
                    min={0}
                    placeholder={week.suggestedReps && !week.reps ? `Sugerido: ${week.suggestedReps} reps` : ''}
                    onChange={(e) => handleChange(index, 'reps', e.target.value)}
                  />
                  {useVolume && (
                    <>
                      <p className="text-sm text-gray-300 mt-1">Volume: {calculateVolume(week.weight > 0 ? week.weight : week.suggestedWeight, week.reps > 0 ? week.reps : week.suggestedReps)}</p>
                    </>
                  )}
                  {!useVolume && (
                    <>
                      <p className="text-sm text-gray-300 mt-1">1RM: {Math.round(calculate1RM(week.weight > 0 ? week.weight : week.suggestedWeight, week.reps > 0 ? week.reps : week.suggestedReps) * 100) / 100}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      }

      <div className="text-center">
        <button onClick={handleAddWeek}>+ Adicionar Semana</button>
      </div>
    </div >
  );
}