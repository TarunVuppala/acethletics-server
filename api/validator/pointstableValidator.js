import Joi from 'joi';

const PointTableValidationSchema = Joi.object({
  team: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),  
  points: Joi.number().integer().min(0).default(0),  
  matches_played: Joi.number().integer().min(0).default(0),  
  wins: Joi.number().integer().min(0).default(0),  
  losses: Joi.number().integer().min(0).default(0),  
  ties: Joi.number().integer().min(0).default(0),  
  net_run_rate: Joi.number().min(0).default(0),  
});

const validatePointTableEntry = (entry) => {
  const { error, value } = PointTableValidationSchema.validate(entry);
  if (error) {
    return { valid: false, error: error.message }; 
  }
  return { valid: true, value };  
};

const validateAndSortPointTable = (pointTable) => {
  const validTable = [];
  const invalidEntries = [];

  for (const entry of pointTable) {
    const { valid, value, error } = validatePointTableEntry(entry);
    if (valid) {
      validTable.push(value);  
    } else {
      invalidEntries.push({ entry, error });  
    }
  }

  validTable.sort((a, b) => b.points - a.points);

  return { validTable, invalidEntries };  
};

export default validateAndSortPointTable;
