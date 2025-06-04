import React, { useState } from 'react';

export default function OneRMTracker() {
  const [weeks, setWeeks] = useState([
    { weight: '', reps: '', suggestedWeight: null, suggestedReps: null }
  ]);

  const [useBarbell, setUseBarbell] = useState(false);
  const [barWeight, setBarWeight] = useState(15);
  const [plates, setPlates] = useState("1,2,3,4,5,10,20");

  const calculate1RM = (weight, reps) => {
    return weight * (1 + reps / 30);
  };

  const calculateFrom1RM = (target1RM, value, type) => {
    if (type === 'reps') {
      return Math.ceil(target1RM / (1 + value / 30));
    } else {
      return Math.ceil(((target1RM / value) - 1) * 30);
    }
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
    const lastWeek = weeks[weeks.length - 1];
    if(!lastWeek) {
     setWeeks([...weeks, { weight: '', reps: '', suggestedWeight: null, suggestedReps: null }]);
      return
    }
    let suggestedWeight = null;
    let suggestedReps = null;

    const weight = parseFloat(lastWeek.weight);
    const reps = parseInt(lastWeek.reps);

    if (!isNaN(weight) && !isNaN(reps)) {
      const last1RM = calculate1RM(weight, reps);
      suggestedWeight = Math.ceil(last1RM + 1);
      let suggestionCheck = calculatePlates(suggestedWeight);
      while (useBarbell && suggestionCheck.mismatch) {
        suggestionCheck = calculatePlates(++suggestedWeight);
      }
    }

    setWeeks([...weeks, { weight: '', reps: '', suggestedWeight, suggestedReps }]);
  };

  const handleRemoveWeek = (index) => {
    setWeeks((oldWeeks) => oldWeeks.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[index][field] = value;

    const prevWeek = weeks[index - 1];
    if (index > 0 && prevWeek && prevWeek.weight && prevWeek.reps) {
      const last1RM = calculate1RM(parseFloat(prevWeek.weight), parseInt(prevWeek.reps)) + 1;

      if (field === 'reps' && value) {
        let weightSuggestion = calculateFrom1RM(last1RM, parseInt(value), 'reps');
        let suggestionCheck = calculatePlates(weightSuggestion);
        while (useBarbell && suggestionCheck.mismatch) {
          suggestionCheck = calculatePlates(++weightSuggestion);
        }
        updatedWeeks[index].suggestedWeight = (useBarbell && suggestionCheck.mismatch) ? null : weightSuggestion;
      } else if (field === 'weight' && value) {
        updatedWeeks[index].suggestedReps = calculateFrom1RM(last1RM, parseFloat(value), 'weight');
      }
    }

    setWeeks(updatedWeeks);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 text-white bg-gray-900 min-h-screen">
      <h1 className="text-xl font-bold text-center">Calculadora de Progressão 1RM</h1>

      <div className="space-y-2 border p-4 rounded-xl bg-gray-800">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useBarbell}
            onChange={() => setUseBarbell(!useBarbell)}
          />
          <span>Usar barra</span>
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
              <label className="block text-sm">Anilhas disponíveis (separadas por vírgula):</label>
              <input
                type="text"
                className="w-full p-2 border rounded bg-gray-700 text-white"
                value={plates}
                onChange={(e) => setPlates(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {weeks.map((week, index) => {
        const plateInfo = useBarbell && week.weight ? calculatePlates(parseFloat(week.weight)) : null;
        const suggestedPlateInfo = useBarbell && week.suggestedWeight ? calculatePlates(parseFloat(week.suggestedWeight)) : null;

        return (
          <div key={index} className="border p-4 rounded-xl shadow-sm bg-gray-800 space-y-4">
            <div className='d-flex justify-content-between' style={{display: "flex", justifyContent: "space-between"}}>
              <h2 className="font-semibold">Semana {index + 1}</h2>
              <button
                onClick={() => handleRemoveWeek(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
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
                  placeholder={week.suggestedReps && !week.reps ? `Sugerido: ${week.suggestedReps} reps` : ''}
                  onChange={(e) => handleChange(index, 'reps', e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })}

      <div className="text-center">
        <button onClick={handleAddWeek}>+ Adicionar Semana</button>
      </div>
    </div>
  );
}