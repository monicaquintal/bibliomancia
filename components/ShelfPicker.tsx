import { toggleShelfEntry } from "@/actions/shelves";
import { NewShelfForm } from "@/components/NewShelfForm";

export function ShelfPicker({
  entryId,
  shelves,
  memberIds,
}: {
  entryId: string;
  shelves: { id: string; name: string }[];
  memberIds: Set<string>;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs font-medium text-ink-soft">Estantes</h2>
      {shelves.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shelves.map((shelf) => {
            const isMember = memberIds.has(shelf.id);
            return (
              <form key={shelf.id} action={toggleShelfEntry}>
                <input type="hidden" name="entryId" value={entryId} />
                <input type="hidden" name="shelfId" value={shelf.id} />
                <input type="hidden" name="member" value={isMember ? "0" : "1"} />
                <button
                  type="submit"
                  aria-pressed={isMember}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isMember
                      ? "border-cover bg-cover text-paper"
                      : "border-dust-line text-ink-soft hover:border-ink-soft hover:text-ink"
                  }`}
                >
                  {shelf.name}
                </button>
              </form>
            );
          })}
        </div>
      )}
      <NewShelfForm entryId={entryId} />
    </div>
  );
}
