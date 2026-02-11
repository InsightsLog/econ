import {
  AgentRole,
  AgentMessage,
  Artifact,
  ArtifactType,
  MessageType,
  ProjectState,
  Task,
  TaskStatus,
} from "./types";

/**
 * Base class for all AI agents on the team.
 * Each agent has a role, a system prompt describing its expertise,
 * and the ability to process tasks and produce artifacts.
 */
export abstract class Agent {
  abstract readonly role: AgentRole;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly capabilities: string[];

  /** Process a task and return artifacts */
  abstract execute(task: Task, state: ProjectState): Promise<Artifact[]>;

  /** React to a message from another agent */
  async handleMessage(
    message: AgentMessage,
    state: ProjectState
  ): Promise<AgentMessage | null> {
    return null;
  }

  /** Build the system prompt that defines this agent's persona */
  abstract getSystemPrompt(): string;

  protected createArtifact(
    type: ArtifactType,
    filePath: string,
    content: string,
    description: string
  ): Artifact {
    return {
      id: `${this.role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      filePath,
      content,
      createdBy: this.role,
      description,
    };
  }

  protected sendMessage(
    to: AgentRole | "broadcast",
    type: MessageType,
    payload: unknown
  ): AgentMessage {
    return {
      from: this.role,
      to,
      type,
      payload,
      timestamp: Date.now(),
    };
  }

  protected completeTask(task: Task, artifacts: Artifact[]): Task {
    return {
      ...task,
      status: TaskStatus.Done,
      artifacts: [...task.artifacts, ...artifacts],
    };
  }

  protected log(message: string): void {
    const timestamp = new Date().toISOString().slice(11, 19);
    console.log(`  [${timestamp}] [${this.name}] ${message}`);
  }
}
