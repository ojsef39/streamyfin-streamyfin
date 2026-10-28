import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { dragRow } from "@/test-utils/drax";
import { DraggableQueueList, type QueueRow } from "./DraggableQueueList";

jest.mock(
  "react-native-drax",
  () => jest.requireActual("@/test-utils/drax").draxModule,
);
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/components/common/ServerImage", () => ({ Image: () => null }));

const rows: QueueRow[] = [
  { key: "a", title: "First" },
  { key: "b", title: "Second", subtitle: "Artist" },
  { key: "c", title: "Third" },
];

const handlers = () => ({
  onPressRow: jest.fn(),
  onRemoveRow: jest.fn(),
  onMoveRow: jest.fn(),
  onDragActiveChange: jest.fn(),
});

const draxItems = () =>
  screen
    .getAllByTestId("drax-item")
    .map((item) => item.props.draxItemProps as Record<string, unknown>);

describe.each([
  ["scrolls itself", true],
  ["inside a parent that scrolls", false],
])("DraggableQueueList that %s", (_label, scrollable) => {
  test("shows every row, and a press plays that row", async () => {
    const on = handlers();
    await render(
      <DraggableQueueList
        testID='queue'
        rows={rows}
        currentIndex={0}
        icon='musical-note'
        emptyText='Nothing queued'
        scrollable={scrollable}
        {...on}
      />,
    );

    expect(screen.getByText("Second")).toBeTruthy();
    expect(screen.getByText("Artist")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("queue-row-c"));
    expect(on.onPressRow).toHaveBeenCalledWith(2);
  });

  test("moves a dropped row and reports the drag", async () => {
    const on = handlers();
    await render(
      <DraggableQueueList
        rows={rows}
        currentIndex={0}
        icon='musical-note'
        emptyText='Nothing queued'
        scrollable={scrollable}
        {...on}
      />,
    );

    await act(async () => dragRow(2, 0));

    expect(on.onMoveRow).toHaveBeenCalledWith(2, 0);
    expect(on.onDragActiveChange.mock.calls).toEqual([[true], [false]]);
  });

  test("ignores a row dropped where it started", async () => {
    const on = handlers();
    await render(
      <DraggableQueueList
        rows={rows}
        currentIndex={0}
        icon='musical-note'
        emptyText='Nothing queued'
        scrollable={scrollable}
        {...on}
      />,
    );

    await act(async () => dragRow(1, 1));

    expect(on.onMoveRow).not.toHaveBeenCalled();
    expect(on.onDragActiveChange.mock.calls).toEqual([[true], [false]]);
  });

  test("shows its empty text when nothing is queued", async () => {
    await render(
      <DraggableQueueList
        rows={[]}
        currentIndex={-1}
        icon='musical-note'
        emptyText='Nothing queued'
        scrollable={scrollable}
        {...handlers()}
      />,
    );

    expect(screen.getByText("Nothing queued")).toBeTruthy();
  });
});

describe("DraggableQueueList rows", () => {
  // Rows drag from their handle only, at once: the rest of a row scrolls
  // the list (or the sheet around it) and takes presses.
  test("drag from their handle", async () => {
    await render(
      <DraggableQueueList
        rows={rows}
        currentIndex={0}
        icon='musical-note'
        emptyText='Nothing queued'
        {...handlers()}
      />,
    );

    for (const item of draxItems()) {
      expect(item).toMatchObject({ dragHandle: true, draggable: true });
    }
  });

  test("cannot be dragged, pressed or removed while the list is disabled", async () => {
    const on = handlers();
    await render(
      <DraggableQueueList
        testID='queue'
        rows={rows}
        currentIndex={0}
        icon='musical-note'
        emptyText='Nothing queued'
        disabled
        {...on}
      />,
    );

    for (const item of draxItems()) {
      expect(item).toMatchObject({ draggable: false });
    }
    await fireEvent.press(screen.getByTestId("queue-row-b"));
    await fireEvent.press(screen.getByTestId("queue-remove-b"));
    expect(on.onPressRow).not.toHaveBeenCalled();
    expect(on.onRemoveRow).not.toHaveBeenCalled();
  });

  test("keep the playing row unless it can be removed", async () => {
    const on = handlers();
    const { rerender } = await render(
      <DraggableQueueList
        testID='queue'
        rows={rows}
        currentIndex={1}
        icon='musical-note'
        emptyText='Nothing queued'
        {...on}
      />,
    );

    expect(screen.queryByTestId("queue-remove-b")).toBeNull();
    await fireEvent.press(screen.getByTestId("queue-remove-c"));
    expect(on.onRemoveRow).toHaveBeenCalledWith(2);

    await rerender(
      <DraggableQueueList
        testID='queue'
        rows={rows}
        currentIndex={1}
        icon='musical-note'
        emptyText='Nothing queued'
        canRemoveCurrent
        {...on}
      />,
    );
    expect(screen.getByTestId("queue-remove-b")).toBeTruthy();
  });
});
