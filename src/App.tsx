import { useEffect, useMemo, useState } from "react";
import { appsyncRequest } from "./appsync";
import { confirmSignUp, getIdToken, signIn, signOut, signUp } from "./cognito";
import {
  createTaskMutation,
  deleteTaskMutation,
  listMyTasksQuery,
  updateTaskStatusMutation,
} from "./graphql";

type Task = {
  owner: string;
  taskId: string;
  title: string;
  status: string;
  createdAt: string;
};

type Mode = "signup" | "confirm" | "signin" | "tasks";

function mapFriendlyError(message: string) {
  const m = message || "";
  if (m.includes("UserNotConfirmedException"))
    return "Please verify your email first.";
  if (m.includes("NotAuthorizedException")) return "Wrong email or password.";
  if (m.includes("UsernameExistsException"))
    return "An account with this email already exists.";
  if (m.includes("InvalidPasswordException"))
    return "Password does not meet the policy requirements.";
  if (m.includes("CodeMismatchException")) return "Invalid verification code.";
  if (m.includes("ExpiredCodeException"))
    return "That verification code expired. Please request a new one.";
  return message;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ fontSize: 12, fontWeight: 650, opacity: 0.85, marginBottom: 4 }}
    >
      {children}
    </div>
  );
}

function TextButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none",
        border: "none",
        background: "transparent",
        padding: 0,
        margin: 0,
        color: "#2563eb",
        cursor: disabled ? "not-allowed" : "pointer",
        textDecoration: "underline",
        fontSize: 13,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "1px solid #111827",
        background: "#111827",
        color: "white",
        padding: "10px 12px",
        borderRadius: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        outline: "none",
        boxSizing: "border-box",
        fontSize: 14,
        ...(props.style ?? {}),
      }}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        outline: "none",
        fontSize: 14,
        ...(props.style ?? {}),
      }}
    />
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "#ffebe9",
        border: "1px solid #ff8182",
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      {message}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 640,
        margin: 0,
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            {subtitle}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function SignInForm({
  email,
  password,
  busy,
  canSubmit,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onGoSignUp,
}: {
  email: string;
  password: string;
  busy: boolean;
  canSubmit: boolean;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onSubmit: () => void;
  onGoSignUp: () => void;
}) {
  return (
    <Card
      title="Sign in"
      subtitle="Use your email and password to access your tasks."
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input
            placeholder="you@example.com"
            value={email}
            autoComplete="email"
            onChange={(e) => onChangeEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <Input
            placeholder="••••••••"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => onChangePassword(e.target.value)}
            disabled={busy}
          />
        </div>

        <PrimaryButton disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? "Signing in..." : "Sign in"}
        </PrimaryButton>

        <div style={{ fontSize: 13, opacity: 0.8 }}>
          No account?{" "}
          <TextButton onClick={onGoSignUp} disabled={busy}>
            Sign up
          </TextButton>
        </div>
      </div>
    </Card>
  );
}

function SignUpForm({
  username,
  email,
  password,
  busy,
  canSubmit,
  onChangeUsername,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onGoSignIn,
}: {
  username: string;
  email: string;
  password: string;
  busy: boolean;
  canSubmit: boolean;
  onChangeUsername: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onSubmit: () => void;
  onGoSignIn: () => void;
}) {
  return (
    <Card
      title="Create account"
      subtitle="We’ll email you a verification code after you sign up."
    >
      <div style={{ display: "grid", gap: 10, boxSizing: "border-box" }}>
        <div>
          <FieldLabel>Username</FieldLabel>
          <Input
            placeholder="yourusername"
            value={username}
            autoComplete="username"
            onChange={(e) => onChangeUsername(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <FieldLabel>Email</FieldLabel>
          <Input
            placeholder="you@example.com"
            value={email}
            autoComplete="email"
            onChange={(e) => onChangeEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <FieldLabel>Password</FieldLabel>
          <Input
            placeholder="Create a strong password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => onChangePassword(e.target.value)}
            disabled={busy}
          />
          <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
            Tip: use 8+ chars with numbers/symbols (depends on pool policy).
          </div>
        </div>

        <PrimaryButton disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? "Creating..." : "Create account"}
        </PrimaryButton>

        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Already have an account?{" "}
          <TextButton onClick={onGoSignIn} disabled={busy}>
            Sign in
          </TextButton>
        </div>
      </div>
    </Card>
  );
}

function ConfirmEmailForm({
  email,
  code,
  usernamePresent,
  busy,
  canSubmit,
  onChangeEmail,
  onChangeCode,
  onSubmit,
  onGoSignIn,
}: {
  email: string;
  code: string;
  usernamePresent: boolean;
  busy: boolean;
  canSubmit: boolean;
  onChangeEmail: (v: string) => void;
  onChangeCode: (v: string) => void;
  onSubmit: () => void;
  onGoSignIn: () => void;
}) {
  return (
    <Card
      title="Verify your email"
      subtitle={
        email.trim()
          ? `We sent a code to ${email.trim()}.`
          : "Enter the email you used to sign up."
      }
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input
            placeholder="you@example.com"
            value={email}
            autoComplete="email"
            onChange={(e) => onChangeEmail(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <FieldLabel>Verification code</FieldLabel>
          <Input
            placeholder="123456"
            inputMode="numeric"
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            disabled={busy}
          />
        </div>

        <PrimaryButton disabled={!canSubmit || busy} onClick={onSubmit}>
          {busy ? "Verifying..." : "Verify email"}
        </PrimaryButton>

        {!usernamePresent && (
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            This demo needs the username from the sign-up step to confirm. If
            you refreshed the page, go back and sign up again.
          </div>
        )}

        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Back to{" "}
          <TextButton onClick={onGoSignIn} disabled={busy}>
            Sign in
          </TextButton>
        </div>
      </div>
    </Card>
  );
}

function TasksView({
  tasks,
  newTitle,
  busy,
  onChangeNewTitle,
  onRefresh,
  onLogout,
  onCreate,
  onUpdateStatus,
  onDelete,
}: {
  tasks: Task[];
  newTitle: string;
  busy: boolean;
  onChangeNewTitle: (v: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onCreate: () => void;
  onUpdateStatus: (taskId: string, status: string) => void;
  onDelete: (taskId: string) => void;
}) {
  return (
    <div style={{ marginTop: 18, width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>My Tasks</h2>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 10,
            flexWrap: "wrap",
          }}
        >
          <PrimaryButton disabled={busy} onClick={onRefresh}>
            Refresh
          </PrimaryButton>
          <PrimaryButton disabled={busy} onClick={onLogout}>
            Logout
          </PrimaryButton>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="New task title..."
          value={newTitle}
          onChange={(e) => onChangeNewTitle(e.target.value)}
          disabled={busy}
          style={{ maxWidth: 460 }}
        />
        <PrimaryButton disabled={!newTitle.trim() || busy} onClick={onCreate}>
          {busy ? "Working..." : "Add"}
        </PrimaryButton>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          justifyContent: "center",
        }}
      >
        {tasks.map((t) => (
          <div
            key={t.taskId}
            style={{
              width: "100%",
              maxWidth: 640,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 12,
              boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 220 }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                  {t.status} • {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Select
                  value={t.status}
                  onChange={(e) => onUpdateStatus(t.taskId, e.target.value)}
                  disabled={busy}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="DONE">DONE</option>
                </Select>
                <PrimaryButton
                  onClick={() => onDelete(t.taskId)}
                  disabled={busy}
                >
                  Delete
                </PrimaryButton>
              </div>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 640,
              border: "1px dashed #d1d5db",
              borderRadius: 12,
              padding: 14,
              opacity: 0.8,
              textAlign: "center",
              boxSizing: "border-box",
            }}
          >
            No tasks yet. Create your first one above 👆
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("signin");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [idToken, setIdToken] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const orderedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tasks]);

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSignUp = useMemo(
    () => Boolean(username.trim() && email.trim() && password.trim()),
    [username, email, password]
  );

  const canSignIn = useMemo(
    () => Boolean(email.trim() && password.trim()),
    [email, password]
  );

  const canConfirm = useMemo(
    () => Boolean(email.trim() && code.trim() && username.trim()),
    [email, code, username]
  );

  useEffect(() => {
    (async () => {
      const token = await getIdToken();
      if (token) {
        setIdToken(token);
        setMode("tasks");
        await loadTasks(token);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTasks(token: string) {
    const data = await appsyncRequest<{ listMyTasks: Task[] }>(
      token,
      listMyTasksQuery
    );
    setTasks(data.listMyTasks);
  }

  async function handleSignUp() {
    setErr(null);
    setBusy(true);
    try {
      await signUp(username.trim(), email.trim(), password);
      setMode("confirm");
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setErr(null);
    setBusy(true);
    try {
      await confirmSignUp(username.trim(), code.trim());
      setMode("signin");
      setCode("");
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn() {
    setErr(null);
    setBusy(true);
    try {
      const session = await signIn(email.trim(), password);
      const token = session.getIdToken().getJwtToken();

      setIdToken(token);
      setMode("tasks");
      await loadTasks(token);
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    signOut();
    setIdToken(null);
    setTasks([]);
    setMode("signin");
  }

  async function handleCreate() {
    if (!idToken) return;
    setErr(null);
    setBusy(true);
    try {
      const title = newTitle.trim();
      if (!title) throw new Error("Title is required.");
      await appsyncRequest(idToken, createTaskMutation, { input: { title } });
      setNewTitle("");
      await loadTasks(idToken);
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateStatus(taskId: string, status: string) {
    if (!idToken) return;
    setErr(null);
    setBusy(true);
    try {
      await appsyncRequest(idToken, updateTaskStatusMutation, {
        input: { taskId, status },
      });
      await loadTasks(idToken);
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!idToken) return;
    setErr(null);
    setBusy(true);
    try {
      await appsyncRequest(idToken, deleteTaskMutation, { taskId });
      await loadTasks(idToken);
    } catch (e: any) {
      setErr(mapFriendlyError(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 900,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 style={{ width: "100%", textAlign: "center", marginBottom: 24 }}>
          Annotate your tasks
        </h1>

        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {err && <ErrorBanner message={err} />}

          {mode === "signin" && (
            <SignInForm
              email={email}
              password={password}
              busy={busy}
              canSubmit={canSignIn}
              onChangeEmail={setEmail}
              onChangePassword={setPassword}
              onSubmit={handleSignIn}
              onGoSignUp={() => setMode("signup")}
            />
          )}

          {mode === "signup" && (
            <SignUpForm
              username={username}
              email={email}
              password={password}
              busy={busy}
              canSubmit={canSignUp}
              onChangeUsername={setUsername}
              onChangeEmail={setEmail}
              onChangePassword={setPassword}
              onSubmit={handleSignUp}
              onGoSignIn={() => setMode("signin")}
            />
          )}

          {mode === "confirm" && (
            <ConfirmEmailForm
              email={email}
              code={code}
              usernamePresent={Boolean(username.trim())}
              busy={busy}
              canSubmit={canConfirm}
              onChangeEmail={setEmail}
              onChangeCode={setCode}
              onSubmit={handleConfirm}
              onGoSignIn={() => setMode("signin")}
            />
          )}

          {mode === "tasks" && (
            <TasksView
              tasks={orderedTasks}
              newTitle={newTitle}
              busy={busy}
              onChangeNewTitle={setNewTitle}
              onRefresh={() => idToken && loadTasks(idToken)}
              onLogout={handleLogout}
              onCreate={handleCreate}
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
