/**
 * Calculator Engine
 * Phase 4.1: Interactive Elements System
 *
 * Engine for processing calculator interactions with safe formula evaluation.
 */

import {
  CalculatorConfig,
  CalculatorResponse,
  CalculatorInput,
  CalculatorOutput,
  CalculatorBreakdownItem,
} from '../types';
import {
  BaseInteractiveEngine,
  EngineValidationResult,
  EngineProcessResult,
  ValidationError,
  ValidationWarning,
  mergeValidationResults,
} from './base';

// ============================================================================
// CALCULATOR RESULT TYPES
// ============================================================================

export interface CalculatorProcessResult {
  outputs: Record<string, FormattedOutput>;
  breakdown?: Record<string, FormattedOutput>;
  summary: string;
  totalValue?: number;
}

export interface FormattedOutput {
  rawValue: number;
  formattedValue: string;
  label: string;
  description?: string;
  highlight?: boolean;
}

export interface CalculatorState extends Record<string, unknown> {
  inputValues: Record<string, number | string>;
  outputs: Record<string, number>;
  isCalculated: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// SAFE FORMULA EVALUATOR
// ============================================================================

/**
 * Safe mathematical expression evaluator
 * Does NOT use eval() - parses and evaluates expressions safely
 */
class FormulaEvaluator {
  private variables: Record<string, number>;

  constructor(variables: Record<string, number>) {
    this.variables = variables;
  }

  /**
   * Evaluate a mathematical expression safely
   */
  evaluate(expression: string): number {
    const tokens = this.tokenize(expression);
    const postfix = this.toPostfix(tokens);
    return this.evaluatePostfix(postfix);
  }

  /**
   * Tokenize the expression
   */
  private tokenize(expression: string): (string | number)[] {
    const tokens: (string | number)[] = [];
    let current = '';

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];

      if (/\s/.test(char)) {
        if (current) {
          tokens.push(this.parseToken(current));
          current = '';
        }
        continue;
      }

      if (/[+\-*/()^%]/.test(char)) {
        if (current) {
          tokens.push(this.parseToken(current));
          current = '';
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(this.parseToken(current));
    }

    return tokens;
  }

  /**
   * Parse a token into a number or variable reference
   */
  private parseToken(token: string): number {
    // Try to parse as number
    const num = parseFloat(token);
    if (!isNaN(num)) {
      return num;
    }

    // Check for built-in functions
    const funcMatch = token.match(/^(\w+)\((.+)\)$/);
    if (funcMatch) {
      const func = funcMatch[1].toLowerCase();
      const arg = this.evaluate(funcMatch[2]);
      return this.applyFunction(func, arg);
    }

    // Look up variable
    if (token in this.variables) {
      return this.variables[token];
    }

    throw new Error(`Unknown variable or function: ${token}`);
  }

  /**
   * Apply a built-in function
   */
  private applyFunction(func: string, arg: number): number {
    switch (func) {
      case 'abs':
        return Math.abs(arg);
      case 'round':
        return Math.round(arg);
      case 'floor':
        return Math.floor(arg);
      case 'ceil':
        return Math.ceil(arg);
      case 'sqrt':
        return Math.sqrt(arg);
      case 'log':
        return Math.log10(arg);
      case 'ln':
        return Math.log(arg);
      case 'exp':
        return Math.exp(arg);
      case 'min':
        return arg; // Single argument min
      case 'max':
        return arg; // Single argument max
      default:
        throw new Error(`Unknown function: ${func}`);
    }
  }

  /**
   * Convert infix to postfix notation (Shunting Yard algorithm)
   */
  private toPostfix(tokens: (string | number)[]): (string | number)[] {
    const output: (string | number)[] = [];
    const operators: string[] = [];

    const precedence: Record<string, number> = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '%': 2,
      '^': 3,
    };

    const isRightAssociative: Record<string, boolean> = {
      '^': true,
    };

    for (const token of tokens) {
      if (typeof token === 'number') {
        output.push(token);
      } else if (token === '(') {
        operators.push(token);
      } else if (token === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          output.push(operators.pop()!);
        }
        operators.pop(); // Remove '('
      } else if (token in precedence) {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== '(' &&
          (precedence[operators[operators.length - 1]] > precedence[token] ||
            (precedence[operators[operators.length - 1]] === precedence[token] &&
              !isRightAssociative[token]))
        ) {
          output.push(operators.pop()!);
        }
        operators.push(token);
      }
    }

    while (operators.length > 0) {
      output.push(operators.pop()!);
    }

    return output;
  }

  /**
   * Evaluate postfix expression
   */
  private evaluatePostfix(postfix: (string | number)[]): number {
    const stack: number[] = [];

    for (const token of postfix) {
      if (typeof token === 'number') {
        stack.push(token);
      } else {
        const b = stack.pop()!;
        const a = stack.pop()!;
        stack.push(this.applyOperator(token, a, b));
      }
    }

    return stack[0] || 0;
  }

  /**
   * Apply an operator
   */
  private applyOperator(op: string, a: number, b: number): number {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        if (b === 0) throw new Error('Division by zero');
        return a / b;
      case '%':
        return a % b;
      case '^':
        return Math.pow(a, b);
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }
}

// ============================================================================
// CALCULATOR ENGINE CLASS
// ============================================================================

export class CalculatorEngine extends BaseInteractiveEngine<
  CalculatorConfig,
  CalculatorResponse,
  CalculatorProcessResult,
  CalculatorState
> {
  // ============================================================================
  // CONFIGURATION VALIDATION
  // ============================================================================

  validateConfig(): EngineValidationResult {
    const baseResult = this.validateBaseConfig();
    const calculatorResult = this.validateCalculatorConfig();
    return mergeValidationResults(baseResult, calculatorResult);
  }

  private validateCalculatorConfig(): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate inputs exist
    if (!this.config.inputs || this.config.inputs.length === 0) {
      errors.push({
        field: 'inputs',
        message: 'Calculator must have at least one input',
        code: 'NO_INPUTS',
      });
    } else {
      // Validate each input
      for (let i = 0; i < this.config.inputs.length; i++) {
        const input = this.config.inputs[i];
        const inputErrors = this.validateInput(input, i);
        errors.push(...inputErrors.errors);
        warnings.push(...inputErrors.warnings);
      }
    }

    // Validate outputs exist
    if (!this.config.outputs || this.config.outputs.length === 0) {
      errors.push({
        field: 'outputs',
        message: 'Calculator must have at least one output',
        code: 'NO_OUTPUTS',
      });
    } else {
      // Validate each output
      for (let i = 0; i < this.config.outputs.length; i++) {
        const output = this.config.outputs[i];
        const outputErrors = this.validateOutput(output, i);
        errors.push(...outputErrors.errors);
        warnings.push(...outputErrors.warnings);
      }
    }

    // Validate breakdown if present
    if (this.config.breakdown) {
      for (let i = 0; i < this.config.breakdown.length; i++) {
        const item = this.config.breakdown[i];
        const itemErrors = this.validateBreakdownItem(item, i);
        errors.push(...itemErrors.errors);
        warnings.push(...itemErrors.warnings);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateInput(input: CalculatorInput, index: number): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `inputs[${index}]`;

    if (!input.name || input.name.trim() === '') {
      errors.push({
        field: `${prefix}.name`,
        message: `Input ${index + 1} name is required`,
        code: 'EMPTY_INPUT_NAME',
      });
    }

    if (!input.label || input.label.trim() === '') {
      errors.push({
        field: `${prefix}.label`,
        message: `Input ${index + 1} label is required`,
        code: 'EMPTY_INPUT_LABEL',
      });
    }

    // Validate min/max for numeric inputs
    if (input.min !== undefined && input.max !== undefined && input.min > input.max) {
      errors.push({
        field: `${prefix}.min`,
        message: `Input ${index + 1} min value cannot be greater than max`,
        code: 'INVALID_MIN_MAX',
      });
    }

    // Validate select/radio have options
    if (['select', 'radio'].includes(input.type)) {
      if (!input.options || input.options.length === 0) {
        errors.push({
          field: `${prefix}.options`,
          message: `Input ${index + 1} requires options for type ${input.type}`,
          code: 'NO_OPTIONS',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateOutput(output: CalculatorOutput, index: number): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `outputs[${index}]`;

    if (!output.label || output.label.trim() === '') {
      errors.push({
        field: `${prefix}.label`,
        message: `Output ${index + 1} label is required`,
        code: 'EMPTY_OUTPUT_LABEL',
      });
    }

    if (!output.formula || output.formula.trim() === '') {
      errors.push({
        field: `${prefix}.formula`,
        message: `Output ${index + 1} formula is required`,
        code: 'EMPTY_OUTPUT_FORMULA',
      });
    } else {
      // Validate formula syntax
      const formulaError = this.validateFormula(output.formula);
      if (formulaError) {
        errors.push({
          field: `${prefix}.formula`,
          message: formulaError,
          code: 'INVALID_FORMULA',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateBreakdownItem(
    item: CalculatorBreakdownItem,
    index: number
  ): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const prefix = `breakdown[${index}]`;

    if (!item.formula || item.formula.trim() === '') {
      errors.push({
        field: `${prefix}.formula`,
        message: `Breakdown item ${index + 1} formula is required`,
        code: 'EMPTY_BREAKDOWN_FORMULA',
      });
    } else {
      const formulaError = this.validateFormula(item.formula);
      if (formulaError) {
        errors.push({
          field: `${prefix}.formula`,
          message: formulaError,
          code: 'INVALID_BREAKDOWN_FORMULA',
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateFormula(formula: string): string | null {
    try {
      // Create dummy variables for validation
      const dummyVars: Record<string, number> = {};
      for (const input of this.config.inputs) {
        dummyVars[input.name] = 1;
      }

      const evaluator = new FormulaEvaluator(dummyVars);
      evaluator.evaluate(formula);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Invalid formula';
    }
  }

  // ============================================================================
  // RESPONSE PROCESSING
  // ============================================================================

  processResponse(
    response: Partial<CalculatorResponse>
  ): EngineProcessResult<CalculatorProcessResult> {
    try {
      const inputValues = response.inputValues || {};

      // Validate input values
      const validation = this.validateInputValues(inputValues);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map((e) => e.message).join(', '),
        };
      }

      // Convert all values to numbers
      const numericValues = this.normalizeInputValues(inputValues);

      // Calculate outputs
      const outputs = this.calculateOutputs(numericValues);

      // Calculate breakdown if enabled
      let breakdown: Record<string, FormattedOutput> | undefined;
      if (this.config.settings.showBreakdown && this.config.breakdown) {
        breakdown = this.calculateBreakdown(numericValues);
      }

      // Generate summary
      const summary = this.generateSummary(outputs);

      // Find total/primary value if exists
      const primaryOutput = this.config.outputs.find((o) => o.highlight);
      const totalValue = primaryOutput
        ? outputs[primaryOutput.id].rawValue
        : Object.values(outputs)[0]?.rawValue;

      const result: CalculatorProcessResult = {
        outputs,
        breakdown,
        summary,
        totalValue,
      };

      return {
        success: true,
        data: result,
        metadata: {
          calculatedAt: new Date().toISOString(),
          inputCount: Object.keys(inputValues).length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate',
      };
    }
  }

  private validateInputValues(
    values: Record<string, number | string>
  ): EngineValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const input of this.config.inputs) {
      const value = values[input.name];

      if (input.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: input.name,
          message: `${input.label} is required`,
          code: 'REQUIRED_INPUT',
        });
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        if (isNaN(numValue)) {
          errors.push({
            field: input.name,
            message: `${input.label} must be a valid number`,
            code: 'INVALID_NUMBER',
          });
          continue;
        }

        if (input.min !== undefined && numValue < input.min) {
          errors.push({
            field: input.name,
            message: `${input.label} must be at least ${input.min}`,
            code: 'BELOW_MIN',
          });
        }

        if (input.max !== undefined && numValue > input.max) {
          errors.push({
            field: input.name,
            message: `${input.label} must be at most ${input.max}`,
            code: 'ABOVE_MAX',
          });
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private normalizeInputValues(
    values: Record<string, number | string>
  ): Record<string, number> {
    const normalized: Record<string, number> = {};

    for (const input of this.config.inputs) {
      const value = values[input.name];
      if (value !== undefined && value !== null && value !== '') {
        normalized[input.name] =
          typeof value === 'string' ? parseFloat(value) : value;
      } else if (input.defaultValue !== undefined) {
        normalized[input.name] =
          typeof input.defaultValue === 'string'
            ? parseFloat(input.defaultValue)
            : input.defaultValue;
      } else {
        normalized[input.name] = 0;
      }
    }

    return normalized;
  }

  private calculateOutputs(
    inputValues: Record<string, number>
  ): Record<string, FormattedOutput> {
    const outputs: Record<string, FormattedOutput> = {};
    const evaluator = new FormulaEvaluator(inputValues);

    for (const output of this.config.outputs) {
      const rawValue = evaluator.evaluate(output.formula);
      outputs[output.id] = {
        rawValue,
        formattedValue: this.formatValue(rawValue, output),
        label: output.label,
        description: output.description,
        highlight: output.highlight,
      };
    }

    return outputs;
  }

  private calculateBreakdown(
    inputValues: Record<string, number>
  ): Record<string, FormattedOutput> {
    const breakdown: Record<string, FormattedOutput> = {};
    const evaluator = new FormulaEvaluator(inputValues);

    for (const item of this.config.breakdown || []) {
      const rawValue = evaluator.evaluate(item.formula);
      const id = item.label.toLowerCase().replace(/\s+/g, '_');
      breakdown[id] = {
        rawValue,
        formattedValue: this.formatValue(rawValue, {
          format: item.format,
          decimals: 2,
        } as CalculatorOutput),
        label: item.label,
        description: item.description,
      };
    }

    return breakdown;
  }

  private formatValue(
    value: number,
    output: Pick<CalculatorOutput, 'format' | 'decimals' | 'prefix' | 'suffix'>
  ): string {
    const decimals = output.decimals ?? 2;
    let formatted: string;

    switch (output.format) {
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;

      case 'percentage':
        formatted = `${(value * 100).toFixed(decimals)}%`;
        break;

      case 'number':
      default:
        formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);
        break;
    }

    if (output.prefix) {
      formatted = `${output.prefix}${formatted}`;
    }

    if (output.suffix) {
      formatted = `${formatted}${output.suffix}`;
    }

    return formatted;
  }

  private generateSummary(outputs: Record<string, FormattedOutput>): string {
    const highlightedOutput = Object.values(outputs).find((o) => o.highlight);
    if (highlightedOutput) {
      return `${highlightedOutput.label}: ${highlightedOutput.formattedValue}`;
    }

    const firstOutput = Object.values(outputs)[0];
    if (firstOutput) {
      return `${firstOutput.label}: ${firstOutput.formattedValue}`;
    }

    return 'Calculation complete';
  }

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  getInitialState(): CalculatorState {
    const inputValues: Record<string, number | string> = {};

    for (const input of this.config.inputs) {
      inputValues[input.name] = input.defaultValue ?? 0;
    }

    return {
      inputValues,
      outputs: {},
      isCalculated: false,
      errors: {},
    };
  }

  /**
   * Get inputs in display order
   */
  getOrderedInputs(): CalculatorInput[] {
    return [...this.config.inputs].sort((a, b) => a.order - b.order);
  }

  /**
   * Get outputs in display order
   */
  getOrderedOutputs(): CalculatorOutput[] {
    return [...this.config.outputs].sort((a, b) => a.order - b.order);
  }

  /**
   * Calculate with current values (for real-time updates)
   */
  calculateRealTime(
    inputValues: Record<string, number | string>
  ): Record<string, FormattedOutput> | null {
    if (!this.config.settings.realTimeCalculation) {
      return null;
    }

    try {
      const normalized = this.normalizeInputValues(inputValues);
      return this.calculateOutputs(normalized);
    } catch {
      return null;
    }
  }

  /**
   * Get calculator type
   */
  getCalculatorType(): string {
    return this.config.calculatorType;
  }

  /**
   * Check if breakdown is enabled
   */
  hasBreakdown(): boolean {
    return (
      this.config.settings.showBreakdown &&
      !!this.config.breakdown &&
      this.config.breakdown.length > 0
    );
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new CalculatorEngine instance
 */
export function createCalculatorEngine(config: CalculatorConfig): CalculatorEngine {
  return new CalculatorEngine(config);
}

/**
 * Evaluate a formula with given variables (standalone utility)
 */
export function evaluateFormula(
  formula: string,
  variables: Record<string, number>
): number {
  const evaluator = new FormulaEvaluator(variables);
  return evaluator.evaluate(formula);
}
