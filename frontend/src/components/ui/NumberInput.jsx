const NumberInput = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  placeholder,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-dark-300 mb-2">
          {label}
        </label>
      )}
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
};

export default NumberInput;
