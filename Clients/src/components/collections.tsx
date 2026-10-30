"use client";
import Image from "@/components/image";
import Link from "@/components/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { api, errorMessage, get, money } from "@/lib/api";
import type { Collection, PageResult } from "@/lib/types";
import { notify, useAppDispatch, useAppSelector } from "@/store";
import { Empty, ErrorState, Loading, Modal, Protected } from "./ui";
import { ListingCard } from "./listing-card";

function CollectionsContent() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["collections", user.id],
    queryFn: () => get<Collection[]>("/collections"),
  });
  return (
    <div className="container content-page">
      <div className="page-intro page-intro-row">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER, TOGETHER IN ONE PLACE</p>
          <h1>
            A collection of
            <br />
            <em>possibilities.</em>
          </h1>
          <p className="form-note">
            The homes you love, and the little things you love about them.
          </p>
        </div>
        <button className="button" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Create a collection
        </button>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : query.data?.length ? (
        <div className="grid-three">
          {query.data.map((c) => (
            <Link
              key={c.id}
              href={`/collections/${c.id}`}
              className="collection-preview"
            >
              <div className="collection-preview-image">
                {c.items[0]?.property.media[0] ? (
                  <Image
                    src={c.items[0].property.media[0].url}
                    alt={c.name}
                    fill
                    sizes="33vw"
                  />
                ) : (
                  "H."
                )}
              </div>
              <div className="row-actions">
                <h3>{c.name}</h3>
                <ArrowUpRight size={20} />
              </div>
              <p>
                {c.items.length}{" "}
                {c.items.length === 1 ? "possibility" : "possibilities"} to call
                your own
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="Good things belong together."
          text="Create your first collection, add homes, and keep your thoughts in one considered space."
        />
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Give your next chapter a name."
      >
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const name = String(
              new FormData(e.currentTarget).get("name"),
            ).trim();
            if (!name) return;
            setBusy(true);
            try {
              const { data } = await api.post<Collection>("/collections", {
                name,
              });
              await query.refetch();
              router.push(`/collections/${data.id}`);
            } catch (e) {
              dispatch(notify(errorMessage(e)));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Collection name
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Our next home, perhaps?"
            />
          </label>
          <button className="button" disabled={busy}>
            Create your collection
            <ArrowRight size={18} />
          </button>
        </form>
      </Modal>
    </div>
  );
}
function CollectionNote({
  collectionId,
  item,
  onSaved,
}: {
  collectionId: string;
  item: Collection["items"][number];
  onSaved: () => void;
}) {
  const [note, setNote] = useState(item.note ?? "");
  const [busy, setBusy] = useState(false);
  const dispatch = useAppDispatch();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await api.post(`/collections/${collectionId}/items`, {
            propertyId: item.property.id,
            note,
          });
          onSaved();
          dispatch(notify("A thought worth keeping. Note saved."));
        } catch (e) {
          dispatch(notify(errorMessage(e)));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        A note to remember
        <textarea
          value={note}
          maxLength={2000}
          placeholder="The morning light. The garden. That feeling…"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button
        className="button button-outline button-small"
        disabled={busy || note === (item.note ?? "")}
      >
        <Check size={16} />
        Save your note
      </button>
    </form>
  );
}
function CollectionDetailContent({ id }: { id: string }) {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [dialog, setDialog] = useState<"rename" | "delete" | "add" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["collection", id, user.id],
    queryFn: () => get<Collection>(`/collections/${id}`),
  });
  const homes = useQuery({
    queryKey: ["properties", "collection-picker"],
    queryFn: () => get<PageResult>("/properties", { limit: 100 }),
    enabled: dialog === "add",
  });
  if (query.isLoading) return <Loading />;
  if (query.isError || !query.data)
    return <ErrorState retry={() => query.refetch()} />;
  const collection = query.data;
  const act = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      await query.refetch();
      dispatch(notify(message));
    } catch (e) {
      dispatch(notify(errorMessage(e)));
    } finally {
      setBusy(false);
    }
  };
  const move = (index: number, direction: number) => {
    const ordered = [...collection.items];
    [ordered[index], ordered[index + direction]] = [
      ordered[index + direction],
      ordered[index],
    ];
    act(
      () =>
        Promise.all(
          ordered.map((item, rank) =>
            api.post(`/collections/${id}/items`, {
              propertyId: item.property.id,
              rank,
            }),
          ),
        ),
      "Your possibilities, in your order.",
    );
  };
  return (
    <div className="container content-page">
      <div className="page-intro">
        <Link className="back-link" href="/collections">
          <ArrowLeft size={16} />
          Your collections
        </Link>
        <div className="page-intro-row">
          <div>
            <p className="eyebrow">A SPACE FOR YOUR NEXT CHAPTER</p>
            <h1>{collection.name}</h1>
            <p className="form-note">
              {collection.items.length} possibilities · Your private collection
            </p>
          </div>
          <div className="row-actions">
            <button
              className="button button-small"
              onClick={() => setDialog("add")}
            >
              <Plus size={17} />
              Add a home
            </button>
            <button
              className="icon-button"
              aria-label="Rename collection"
              onClick={() => setDialog("rename")}
            >
              <Pencil size={18} />
            </button>
            <button
              className="icon-button danger-button"
              aria-label="Delete collection"
              onClick={() => setDialog("delete")}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
      {collection.items.length ? (
        <div className="grid-three">
          {collection.items.map((item, index) => (
            <div className="collection-item" key={item.id}>
              <ListingCard property={item.property} />
              <div className="row-actions">
                <span className="pill">Your pick #{index + 1}</span>
                <button
                  className="icon-button"
                  aria-label={`Move ${item.property.title} up`}
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Move ${item.property.title} down`}
                  disabled={busy || index === collection.items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={17} />
                </button>
                <button
                  className="icon-button danger-button"
                  aria-label={`Remove ${item.property.title} from collection`}
                  disabled={busy}
                  onClick={() =>
                    act(
                      () =>
                        api.delete(
                          `/collections/${id}/items/${item.property.id}`,
                        ),
                      "Home removed from this collection.",
                    )
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <CollectionNote
                collectionId={id}
                item={item}
                onSaved={() => query.refetch()}
              />
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="The beginning of something good."
          text="Add a few homes that catch your eye. Keep notes, order your favorites, and picture the possibilities."
          href="/search"
        />
      )}
      <Modal
        open={dialog === "rename"}
        onClose={() => setDialog(null)}
        title="A new name for what’s next."
      >
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const name = String(
              new FormData(e.currentTarget).get("name"),
            ).trim();
            if (!name) return;
            await act(
              () => api.patch(`/collections/${id}`, { name }),
              "Collection renamed.",
            );
            setDialog(null);
          }}
        >
          <label>
            Collection name
            <input
              name="name"
              required
              maxLength={100}
              defaultValue={collection.name}
            />
          </label>
          <button className="button" disabled={busy}>
            Save name
            <Check size={18} />
          </button>
        </form>
      </Modal>
      <Modal
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title="Let this collection go?"
      >
        <p className="form-note">
          “{collection.name}” and its notes will be permanently removed. Your
          saved homes will stay in your account.
        </p>
        <div className="row-actions dialog-actions">
          <button
            className="button button-outline"
            onClick={() => setDialog(null)}
          >
            Keep it
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api.delete(`/collections/${id}`);
                dispatch(
                  notify("Collection removed. Room for new possibilities."),
                );
                router.push("/collections");
              } catch (e) {
                dispatch(notify(errorMessage(e)));
                setBusy(false);
              }
            }}
          >
            Delete collection
            <Trash2 size={17} />
          </button>
        </div>
      </Modal>
      <Modal
        open={dialog === "add"}
        onClose={() => setDialog(null)}
        title="Another possibility."
      >
        {homes.isLoading ? (
          <Loading />
        ) : homes.isError ? (
          <ErrorState retry={() => homes.refetch()} />
        ) : (
          <div className="collection-picker">
            {homes.data?.items.map((p) => {
              const added = collection.items.some(
                (item) => item.property.id === p.id,
              );
              return (
                <button
                  key={p.id}
                  disabled={busy || added}
                  onClick={() =>
                    act(
                      () =>
                        api.post(`/collections/${id}/items`, {
                          propertyId: p.id,
                          rank: collection.items.length,
                        }),
                      `Added ${p.title}.`,
                    )
                  }
                >
                  <Image
                    src={p.media[0]?.url || "/images/hero.jpg"}
                    alt=""
                    width={64}
                    height={48}
                  />
                  <span>
                    {p.title}
                    <small>{money(p.price)}</small>
                  </span>
                  {added ? <Check size={19} /> : <Plus size={19} />}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
export function CollectionsPage() {
  return (
    <Protected>
      <CollectionsContent />
    </Protected>
  );
}
export function CollectionDetail({ id }: { id: string }) {
  return (
    <Protected>
      <CollectionDetailContent id={id} />
    </Protected>
  );
}
