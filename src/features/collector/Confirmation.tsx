import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import { useApp } from '../../app/context';
import { collectionSchema, shortId } from '../../lib/domain';
import { Empty, ErrorMessage, ImageUpload, PageTitle } from '../../components/ui';
import type { CollectionInput } from '../../types/domain';
export function Confirmation() {
  const app = useApp(),
    { id } = useParams(),
    navigate = useNavigate();
  const [file, setFile] = useState<File>(),
    [error, setError] = useState('');
  const submitting = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const request = app.data.requests.find((r) => r.id === id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CollectionInput>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      notes: '',
      destination_name: '',
      destination_status: 'intended',
      destination_type:
        request?.waste_category === 'E-waste & hazardous' ? 'authorized_hazardous' : 'sorting',
      confirmed: false,
    },
  });
  if (!request || request.status !== 'In Progress')
    return (
      <Empty
        title="Collection confirmation unavailable"
        description="Only your assigned, in-progress jobs can be confirmed."
        action={
          <Link className="btn btn-primary" to="/collector">
            Back to tasks
          </Link>
        }
      />
    );
  return (
    <>
      <Link className="back-link" to={`/collector/requests/${id}`}>
        <ArrowLeft size={16} />
        Back to task
      </Link>
      <PageTitle
        eyebrow={shortId(request.id)}
        title="Confirm physical collection"
        description="Record what actually happened. Do not mark uncollected waste as collected."
      />
      <form
        className="card confirmation-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          if (submitting.current) return;
          submitting.current = true;
          setError('');
          try {
            await app.repository!.complete(app.actor!, request.id, values, file);
            await app.refresh();
            if (!mounted.current) return;
            app.notify('Physical collection recorded. Destination information saved.');
            navigate(`/collector/requests/${id}`);
          } catch (e) {
            if (mounted.current)
              setError(e instanceof Error ? e.message : 'Could not record collection');
          } finally {
            submitting.current = false;
          }
        })}
      >
        <div className="info-note">
          <TruckInfo />
          <span>
            {request.waste_category} · {request.quantity}
            <br />
            {request.address} · {request.ward}
          </span>
        </div>
        <h2>Destination record</h2>
        <div className="field">
          <label htmlFor="destination-status">What are you recording?</label>
          <select id="destination-status" {...register('destination_status')}>
            <option value="intended">Intended destination — not yet handed over</option>
            <option value="handed_over">
              Actual handover — waste delivered to this destination
            </option>
          </select>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="destination-type">Destination type *</label>
            <select id="destination-type" {...register('destination_type')}>
              <option value="sorting">Sorting / material recovery</option>
              <option value="composting">Composting / organic processing</option>
              <option value="authorized_hazardous">Authorized e-waste / hazardous handler</option>
              <option value="other">Other appropriate destination</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="destination-name">Destination name *</label>
            <input
              id="destination-name"
              {...register('destination_name')}
              placeholder="Name the intended or actual destination"
            />
            <ErrorMessage message={errors.destination_name?.message} />
          </div>
        </div>
        {request.waste_category === 'E-waste & hazardous' && (
          <div className="info-note warning">
            Only an authorized hazardous handling destination is permitted for this category. Verify
            real handling arrangements before proceeding.
          </div>
        )}
        <div className="field">
          <label htmlFor="collection-notes">Collection notes (optional)</label>
          <textarea id="collection-notes" rows={3} {...register('notes')} />
          <ErrorMessage message={errors.notes?.message} />
        </div>
        <ImageUpload file={file} onChange={setFile} label="Collection proof photo (optional)" />
        <div className="segregation-check">
          <label>
            <input type="checkbox" {...register('confirmed')} />
            <span>
              I confirm that this waste has been physically collected. This record does not certify
              recycling or treatment. *
            </span>
          </label>
          <ErrorMessage message={errors.confirmed?.message} />
        </div>
        <p className="small muted">
          The current timestamp is recorded automatically. Completed records are immutable in this
          application; contact an administrator if a correction is needed.
        </p>
        <ErrorMessage message={error} />
        <button className="btn btn-primary full-width" disabled={isSubmitting}>
          <CheckCheck size={19} />
          {isSubmitting ? 'Recording…' : 'Mark collected & save destination'}
        </button>
      </form>
    </>
  );
}
function TruckInfo() {
  return <CheckCheck size={22} />;
}
