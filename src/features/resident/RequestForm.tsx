import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LocateFixed, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '../../app/context';
import { ErrorMessage, ImageUpload, PageTitle } from '../../components/ui';
import { requestSchema, validCoordinates, wards } from '../../lib/domain';
import { categories, type RequestInput } from '../../types/domain';
const WasteMap = lazy(() => import('../maps/WasteMap'));
export function RequestForm({ dumping = false }: { dumping?: boolean }) {
  const { actor, repository, refresh, notify, demo } = useApp(),
    navigate = useNavigate();
  const [file, setFile] = useState<File>(),
    [error, setError] = useState(''),
    [gps, setGps] = useState(''),
    [locating, setLocating] = useState(false);
  const submitting = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      request_type: dumping ? 'dumping' : 'pickup',
      waste_category: dumping ? 'Unknown' : 'Organic',
      quantity: dumping ? 'Not estimated' : '',
      ward: actor?.ward ?? '',
      address: '',
      latitude: null,
      longitude: null,
      description: '',
      preferred_date: null,
      is_segregated: false,
    },
  });
  const lat = watch('latitude'),
    lng = watch('longitude');
  const coordinates = validCoordinates(lat, lng) ? ([lat!, lng!] as [number, number]) : null;
  const locate = () => {
    if (!navigator.geolocation) {
      setGps('GPS is unavailable. Enter an address, select the map, or enter coordinates instead.');
      return;
    }
    setLocating(true);
    setGps('Your browser will ask for location permission.');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue('latitude', Number(position.coords.latitude.toFixed(6)));
        setValue('longitude', Number(position.coords.longitude.toFixed(6)));
        setGps('Location captured. Check the address and pin before submitting.');
        setLocating(false);
      },
      () => {
        setGps(
          'GPS was denied or unavailable. You can still enter an address, tap the map, or enter coordinates.',
        );
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  };
  const submit = handleSubmit(async (values) => {
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    try {
      const id = await repository!.create(actor!, values, file);
      await refresh();
      if (!mounted.current) return;
      notify(
        `${dumping ? 'Dumping report' : 'Pickup request'} submitted. Awaiting administrator review.`,
      );
      navigate(`/resident/requests/${id}`);
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : 'Could not submit. Please try again.');
    } finally {
      submitting.current = false;
    }
  });
  return (
    <>
      <Link className="back-link" to="/resident">
        <ArrowLeft size={16} />
        Back to overview
      </Link>
      <PageTitle
        eyebrow={dumping ? 'CARE FOR OUR SHARED SPACES' : 'YOUR NEXT RESPONSIBLE STEP'}
        title={dumping ? 'Report open dumping' : 'Request waste pickup'}
        description={
          dumping
            ? 'Help the team locate and review an existing public dumping site.'
            : 'Tell us what you have separated and where collection is needed.'
        }
      />
      <div className="form-layout">
        <form className="card request-form" onSubmit={submit} noValidate>
          <div className="section-heading">
            <h2>{dumping ? 'Dumping site details' : 'Pickup details'}</h2>
            <span className="muted small">* Required</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="category">Waste category *</label>
              <select id="category" {...register('waste_category')}>
                {categories
                  .filter((c) => dumping || !['Mixed', 'Unknown'].includes(c))
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
              <ErrorMessage message={errors.waste_category?.message} />
            </div>
            {!dumping && (
              <div className="field">
                <label htmlFor="quantity">Approximate quantity *</label>
                <input
                  id="quantity"
                  placeholder="e.g. 2 small bags, around 3 kg"
                  {...register('quantity')}
                />
                <ErrorMessage message={errors.quantity?.message} />
              </div>
            )}
            <div className="field">
              <label htmlFor="ward">Ward *</label>
              <select id="ward" {...register('ward')}>
                <option value="">Choose a ward</option>
                {wards.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <ErrorMessage message={errors.ward?.message} />
            </div>
            {!dumping && (
              <div className="field">
                <label htmlFor="preferred-date">Preferred date (optional)</label>
                <input
                  type="date"
                  id="preferred-date"
                  {...register('preferred_date', { setValueAs: (v) => v || null })}
                />
                <ErrorMessage message={errors.preferred_date?.message} />
                <small className="muted">A preference, not a confirmed appointment.</small>
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="address">
              {dumping ? 'Location or nearby landmark' : 'Pickup address'} *
            </label>
            <textarea
              id="address"
              rows={2}
              placeholder={
                dumping
                  ? 'Road, landmark and directions to the site'
                  : 'House name / number, street and nearby landmark'
              }
              {...register('address')}
            />
            <ErrorMessage message={errors.address?.message} />
          </div>
          <details className="location-details" open={dumping}>
            <summary>Add a map location (optional)</summary>
            <p className="small muted">
              Your address is enough to submit. Coordinates help the assigned team navigate.
              {demo && ' New pins you choose are demo inputs, not verified reports.'}
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              disabled={locating}
              onClick={locate}
            >
              <LocateFixed size={16} />
              {locating ? 'Locating…' : 'Use my current location'}
            </button>
            {gps && (
              <p role="status" className="small">
                {gps}
              </p>
            )}
            <Suspense fallback={<p>Loading map…</p>}>
              <WasteMap
                compact
                selected={coordinates}
                onSelect={(latitude, longitude) => {
                  setValue('latitude', latitude);
                  setValue('longitude', longitude);
                }}
              />
            </Suspense>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="latitude">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  step="any"
                  {...register('latitude', {
                    setValueAs: (v) => (v == null || v === '' ? null : Number(v)),
                  })}
                />
                <ErrorMessage message={errors.latitude?.message} />
              </div>
              <div className="field">
                <label htmlFor="longitude">Longitude</label>
                <input
                  id="longitude"
                  type="number"
                  step="any"
                  {...register('longitude', {
                    setValueAs: (v) => (v == null || v === '' ? null : Number(v)),
                  })}
                />
                <ErrorMessage message={errors.longitude?.message} />
              </div>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                setValue('latitude', null);
                setValue('longitude', null);
              }}
            >
              Clear coordinates
            </button>
          </details>
          <div className="field">
            <label htmlFor="description">
              {dumping ? 'Describe the dumping site *' : 'Additional details (optional)'}
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder={
                dumping
                  ? 'What is dumped here? Is it blocking a path or causing a hazard?'
                  : 'Anything the collection team should know?'
              }
              {...register('description')}
            />
            <ErrorMessage message={errors.description?.message} />
          </div>
          <ImageUpload
            file={file}
            onChange={setFile}
            label={dumping ? 'Site photo (optional)' : 'Waste photo (optional)'}
          />
          {!dumping && (
            <div className="segregation-check">
              <label>
                <input type="checkbox" {...register('is_segregated')} />
                <span>I confirm this waste has been segregated from other categories. *</span>
              </label>
              <ErrorMessage message={errors.is_segregated?.message} />
            </div>
          )}
          <ErrorMessage message={error} />
          <div className="form-footer">
            <span className="muted small">
              {demo ? 'Saved locally in demo mode.' : 'Visible only to you and authorized staff.'}
            </span>
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'Submitting…'
                : dumping
                  ? 'Submit dumping report'
                  : 'Submit pickup request'}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="card">
            <ShieldCheck className="forest" size={30} />
            <h2>{dumping ? 'A report starts a conversation.' : 'A request, not a guarantee.'}</h2>
            <p>
              Requests begin as Pending. An administrator reviews availability and assigns a
              collector before collection is coordinated.
            </p>
            <p>
              Real workers and suitable destinations are operational prerequisites — EcoSort does
              not provide them.
            </p>
            <Link className="text-link" to="/resident/guide">
              Review segregation guidance <ArrowRight size={16} />
            </Link>
          </div>
          {watch('waste_category') === 'E-waste & hazardous' && (
            <div className="info-note warning">
              Keep hazardous waste separate. This request requires an authorized handler and must
              not be combined with ordinary collection.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
